/* jslint node: true, esnext: true */
"use strict";

const BaseStep = require('kronos-step').Step;

const ATTRIBUTES = ['description'];
/**
 * This is the flow implementation.
 * It holds all the steps.
 */
const Flow = {
	"name": "kronos-flow",
	"description": "General step collection",

	/**
	 * Declares the following properties:
	 * steps
	 * autostart
	 * @param manager {object} The kronos-service-manager
	 * @param name {string} The name of this step
	 * @param stepDefinition {object} The definition used to create the step
	 * @param props {object} The properties of the new object
	 */
	initialize(manager, name, stepDefinition, props) {

		props.autostart = {
			value: stepDefinition.autostart || false
		};

		// All steps
		const steps = new Map();

		//----------------------------------------------
		//-- Create the sub steps
		//----------------------------------------------
		for (const subStepName in stepDefinition.steps) {
			const subStepDefinition = stepDefinition.steps[subStepName];
			subStepDefinition.name = subStepName;
			const createdStep = manager.createStepInstanceFromConfig(subStepDefinition, manager);
			if (!createdStep) {
				throw new Error(`The step '${subStepName}' in the flow '${this.name}' could not been ceated.`);
			}
			steps.set(subStepName, createdStep);
		}

		props.steps = {
			value: steps
		};

		const ocs = [];
		props.outstandingConnections = {
			value: ocs
		};
	},

	/**
	 * The flow has no real endpoints. It only has proxies.
	 * So just return the configuration
	 * @param {Object} stepDefinition The step configuration
	 */
	createEndpoints(stepDefinition) {
		if (stepDefinition) {
			if (stepDefinition.endpoints) {
				for (const endpointName in stepDefinition.endpoints) {
					this.endpoints[endpointName] = stepDefinition.endpoints[endpointName];
				}
			}
			this.connectEndpoints(stepDefinition);
			this.connectRootEndpoints();
		}
	},

	/**
	 * Find endpoint for given expression
	 * @param {string} expression
	 * @param {boolean} wait for endpoint to become present (deliver a promise)
	 * @param {array[string]} problems
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
					return this.manager.declareService({
						name: res[1]
					}, true).then(svc => svc.endpoints[res[2]]);
				}

				problems.push(`Service '${res[1]}' not found`);
			}
		} else {
			const res = expression.match(/^(.+)\/(.+)/);
			if (res) { // step/endpoint
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
	},

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
					const target = typeof endpointConfig === 'string' ? endpointConfig : endpointConfig.target;

					if (typeof target === 'string') {
						const mandatory = endpointConfig === 'string' ? true : endpointConfig.mandatory === undefined ? true :
							endpointConfig.mandatory;

						const problems = [];
						const targetEndpoint = this.endpointFor(target, mandatory, problems);

						if (targetEndpoint) {
							const endpoint = step.endpoints[endpointName];
							if (targetEndpoint.name) {
								// plain endpoint - no promise
								endpoint.connected = targetEndpoint;
							} else {
								this.outstandingConnections.push(targetEndpoint.then(te => {
									this.info(level => `connect: ${endpoint} <> ${te}`);
									endpoint.connected = te;
								}));
							}
						} else {
							if (step.type === 'kronos-flow') {
								// The target is a step of the flow itself. This has been handled
								// before as the flow was created. ???
							} else {
								if (mandatory) {
									throw new Error(`While evaluating '${target}' ${problems.join(',')}`);
								}
								this.info(level =>
									`Remove optional endpoint '${endpointName}' since it can't be connected: ${problems.join(',')}`);
								step.removeEndpoint(endpointName);
							}
						}
					}
				}
			}
		}
	},

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
				if (res) { // optional step:
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
							throw new Error(`Target endpoint '${targetEndpointName}' not found in step '${targetStepName}'`);
						}
					} else {
						throw new Error(`Target step '${targetStepName}' not found`);
					}
				} else {
					throw new Error(`Endpoint target '${endpoint}' of endpoint '${endpointName}' is not of right format`);
				}
			} else {
				if (!endpoint.default) {
					throw new Error(`Flow endpoint '${endpointName}' in flow '${name}' is not of type 'string'`);
				}
			}
		}
	},

	_start() {
		return Promise.all(this.outstandingConnections).then(ocs => {
			const sbt = stepsByType(this.steps);
			return Promise.all(sbt.normalSteps.map(s => s.start())).then(() =>
				Promise.all(sbt.inboundSteps.map(s => s.start()))
			);
		});
	},

	_stop() {
		const sbt = stepsByType(this.steps);
		return Promise.all(sbt.inboundSteps.map(s => s.stop())).then(() =>
			Promise.all(sbt.normalSteps.map(s => s.stop()))
		);
	},

	_remove() {
		return Promise.all(mapForEachValue(this.steps, s => s.remove()));
	},

	toJSONWithOptions(options) {
		const json = {
			type: this.type,
			endpoints: {}
		};

		if (options.includeName) {
			json.name = this.name;
		}

		if (options.includeRuntimeInfo) {
			json.state = this.state;
		}

		for (const endpointName in this.endpoints) {
			const currentEndpoint = this.endpoints[endpointName];
			if (!currentEndpoint.default || options.includeDefaults) {

				//json.endpoints[endpointName] = `${currentEndpoint.step.name/${currentEndpoint.name}`;
			}
		}

		// if (options.includeDefaults) {
		ATTRIBUTES.forEach(a => json[a] = this[a]);

		json.steps = {};
		for (const subStepName of this.steps.values()) {
			json.steps[subStepName.name] = subStepName.toJSONWithOptions(options);
		}

		return json;
	}
};

function stepsByType(steps) {
	// The inbound steps will be stopped first
	const normalSteps = [];
	const inboundSteps = [];

	// Sort the steps
	for (const subStep of steps.values()) {
		if (subStep.inbound) {
			inboundSteps.push(subStep);
		} else {
			normalSteps.push(subStep);
		}
	}

	return {
		normalSteps: normalSteps,
		inboundSteps: inboundSteps
	};
}

/**
 * Calls function on each map entry and delivers function reults as an iterable.
 * @param {Map} map
 * @param {Function} f
 * @return {Iterator} result of calling f on each map entry
 * @api private
 */
function mapForEachValue(map, f) {
	const r = [];

	for (const i of map.values()) {
		r.push(f(i));
	}
	return r;
}

/**
 * Load a flow json files and created the flows from it.
 * The flows will be registerd at the manager
 * @param manager {object} The kronos-service-manager
 * @param jsonFlowDefinition {object} The flow definition
 * @return promise
 */
function loadFlows(manager, jsonFlowDefinition) {
	if (!manager) {
		throw new Error("The manager is mandatory");
	}

	const promises = [];

	for (const flowName in jsonFlowDefinition) {
		const singleFlowDefinition = jsonFlowDefinition[flowName];

		singleFlowDefinition.type = "kronos-flow";
		singleFlowDefinition.name = flowName;

		const flow = manager.createStepInstanceFromConfig(singleFlowDefinition, manager);
		promises.push(manager.registerStep(flow));
		promises.push(manager.registerFlow(flow));
	}

	return Promise.all(promises);
}

module.exports.FlowFactory = Object.assign({}, BaseStep, Flow);
module.exports.loadFlows = loadFlows;
