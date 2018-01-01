import { Step } from 'kronos-step';
import { createAttributes, mergeAttributes } from 'model-attributes';
import { stepsByStartupOrder } from './util';
import { FlowProviderMixin } from './flow-provider-mixin';

export { FlowProviderMixin };

/**
 * This is the flow implementation.
 * It holds all the steps.
 * Declares the following properties:
 * -steps
 * -autostart
 * @param {Object} config the definition used to create the flow
 * @param {Object} config.steps steps of the flow
 * @param {Object} owner owner of the flow
 */
export class Flow extends Step {
  /**
   * @return {string} 'kronos-flow'
   */
  static get name() {
    return 'kronos-flow';
  }

  static get description() {
    return 'General step collection';
  }

  static get configurationAttributes() {
    return mergeAttributes(
      createAttributes({
        steps: {
          description: 'steps of the flow',
          type: 'object',
          needsRestart: true,
          setter(steps) {
            console.log(`setSteps: ${this.name} ${Object.keys(steps)}`);

            Object.defineProperty(this, 'steps', { value: new Map() });

            for (const subStepName in steps) {
              const subStepDefinition = steps[subStepName];
              subStepDefinition.name = subStepName;

              const createdStep = this.owner.createStep(
                subStepDefinition,
                this
              );

              if (createdStep === undefined) {
                throw new Error(
                  `The step '${subStepName}' in the flow '${
                    this.name
                  }' could not been ceated.`
                );
              }
              this.steps.set(subStepName, createdStep);
            }

            return true;
          }
        }
      }),
      Step.configurationAttributes
    );
  }

  constructor(config, owner) {
    super(config, owner);

    Object.defineProperties(this, {
      autostart: { value: config.autostart ? true : false },
      outstandingConnections: { value: [] }
    });
  }

  timeoutForTransition(transition) {
    // TODO collect timeouts from all steps ?
    if (transition.name.startsWith('start')) {
      return 10000;
    }

    return super.timeoutForTransition(transition);
  }

  async _start() {
    const ocs = await Promise.all(this.outstandingConnections);

    for (const step of stepsByStartupOrder(this.steps)) {
      await step.start();
    }
  }

  async _stop() {
    for (const step of stepsByStartupOrder(this.steps, true)) {
      await step.stop();
    }
  }

  _remove() {
    return Promise.all(Array.from(this.steps).map(s => s.remove()));
  }

  toJSONWithOptions(options) {
    const json = super.toJSONWithOptions(options);

    json.steps = {};
    for (const subStep of this.steps.values()) {
      json.steps[subStep.name] = subStep.toJSONWithOptions(options);
    }

    return json;
  }

  endpointForExpression(expression, wait) {
    console.log(`endpointForExpression: ${expression}`);

    const [sn, en] = expression.split(/\./);
    const step = this.steps.get(sn);

    if (step !== undefined) {
      console.log(
        `endpintFor ${step.name} ${en} -> ${step.endpointForExpression(en)}`
      );
      return step.endpointForExpression(en, wait);
    }

    return super.endpointForExpression(expression, wait);
  }

  _createEndpointFromConfig(name, definition, interceptorFactory) {
    if (typeof definition === 'string') {
      const e = this.endpointForExpression(definition);
      console.log(`link to present endpoint ${definition} -> ${e}`);
      return e;
    }

    let r = super.createEndpointFromConfig(
      name,
      definition,
      interceptorFactory
    );
    console.log(
      `createEndpointFromConfig: ${name} ${JSON.stringify(definition)} -> ${r}`
    );
    return r;
  }

  _endpointFactoryFromConfig(definition) {
    const r = super.endpointFactoryFromConfig(definition);
    console.log(
      `endpointFactoryFromConfig: ${JSON.stringify(definition)} -> ${r.name}`
    );
    return r;
  }

  /****/

  /**
   * Find endpoint for given expression
   * @param {string} expression
   * @param {boolean} wait for endpoint to become present (deliver a promise)
   * @param {string} problems
   * @return {Endpoint} found endpoint
   */
  endpointFor(expression, wait, problems) {
    const res = expression.match(/^(.+):(.+)/); // service:endpoint

    if (res) {
      const service = this.manager.services[res[1]];
      if (service) {
        const target = service.endpoints[res[2]];
        if (target) {
          return target;
        }
        problems.push(`Endpoint '${res[2]}' of service '${res[1]}' not found`);
      } else {
        if (wait) {
          // wait for service to become present
          return this.manager
            .declareService(
              {
                type: res[1],
                name: res[1]
              },
              true
            )
            .then(svc => svc.endpoints[res[2]]);
        }

        problems.push(`Service '${res[1]}' not found`);
      }
    } else {
      const res = expression.match(/^(.+)\/(.+)/);
      if (res) {
        // step/endpoint
        const step = this.steps.get(res[1]);
        if (step) {
          const target = step.endpoints[res[2]];
          if (target) {
            return target;
          }
          problems.push(`Endpoint '${res[2]}' of step '${res[1]}' not found`);
        } else {
          problems.push(`Step '${res[1]}' not found`);
        }
      }
    }

    return undefined;
  }

  /**
   * set the target endpoints
   */
  connectEndpoints(stepDefinition) {
    for (const subStepName in stepDefinition.steps) {
      const subStepDefinition = stepDefinition.steps[subStepName];

      if (subStepDefinition.endpoints) {
        const step = this.steps.get(subStepName);

        for (const endpointName in subStepDefinition.endpoints) {
          const endpointConfig = subStepDefinition.endpoints[endpointName];
          const target =
            typeof endpointConfig === 'string'
              ? endpointConfig
              : endpointConfig.target;

          if (typeof target === 'string') {
            const mandatory =
              endpointConfig === 'string'
                ? true
                : endpointConfig.mandatory === undefined
                  ? true
                  : endpointConfig.mandatory;

            const problems = [];
            const targetEndpoint = this.endpointFor(
              target,
              mandatory,
              problems
            );

            if (targetEndpoint) {
              const endpoint = step.endpoints[endpointName];
              if (targetEndpoint.name) {
                // plain endpoint - no promise
                endpoint.connected = targetEndpoint;
              } else {
                this.outstandingConnections.push(
                  targetEndpoint.then(te => {
                    this.info(level => `connect: ${endpoint} <> ${te}`);
                    endpoint.connected = te;
                  })
                );
              }
            } else {
              if (step.type === 'kronos-flow') {
                // The target is a step of the flow itself. This has been handled
                // before as the flow was created. ???
              } else {
                if (mandatory) {
                  throw new Error(
                    `While evaluating '${target}' ${problems.join(',')}`
                  );
                }
                this.info(
                  level =>
                    `Remove optional endpoint '${endpointName}' since it can't be connected: ${problems.join(
                      ','
                    )}`
                );
                step.removeEndpoint(endpointName);
              }
            }
          }
        }
      }
    }
  }

  /**
   * A flow has only endpoint proxies. These will be replaced by the original endpoints
   * of the sub steps
   * get the original endpoints for the Flow.
   */
  connectRootEndpoints() {
    const endpoints = this.endpoints;
    const name = this.name;
    const steps = this.steps;

    for (const endpointName in endpoints) {
      const endpoint = endpoints[endpointName];

      if (typeof endpoint === 'string') {
        const res = endpoint.match(/^(.+)\/(.+)/);
        if (res) {
          // optional step:
          const targetStepName = res[1];
          const targetEndpointName = res[2];
          let targetStep = steps.get(targetStepName);

          if (!targetStep) {
            // test if the step refernces this current flow.
            if (targetStepName === name) {
              targetStep = this;
            }
          }

          if (targetStep) {
            const targetEndpoint = targetStep.endpoints[targetEndpointName];
            if (targetEndpoint) {
              endpoints[endpointName] = targetEndpoint;
              targetEndpoint.step = targetStep;
            } else {
              throw new Error(
                `Target endpoint '${targetEndpointName}' not found in step '${targetStepName}'`
              );
            }
          } else {
            throw new Error(`Target step '${targetStepName}' not found`);
          }
        } else {
          throw new Error(
            `Endpoint target '${endpoint}' of endpoint '${endpointName}' is not of right format`
          );
        }
      } else {
        if (!endpoint.default) {
          throw new Error(
            `Flow endpoint '${endpointName}' in flow '${name}' is not of type 'string'`
          );
        }
      }
    }
  }
}

export function registerWithManager(manager) {
  return manager.registerStep(Flow);
}
