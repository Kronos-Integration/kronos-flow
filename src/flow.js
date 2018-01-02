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
    const m = expression.match(/^([\w\-_]+)\.(.*)/);

    if (m) {
      console.log(`endpointForExpression: ${expression} ${m}`);

      const stepName = m[1];
      const suffixExpression = m[2];

      const step = this.steps.get(stepName);

      if (step === undefined) {
        throw new Error(`Step '${stepName}' not found in ${this}`);
      } else {
        return step.endpointForExpression(suffixExpression, wait);
      }
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

  /**
   * Find endpoint for given expression
   * @param {string} expression
   * @param {boolean} wait for endpoint to become present (deliver a promise)
   * @param {string} problems
   * @return {Endpoint} found endpoint
   *
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
    }

    return undefined;
  }
*/
}

export function registerWithManager(manager) {
  return manager.registerStep(Flow);
}
