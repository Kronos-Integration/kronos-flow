/* jslint node: true, esnext: true */
"use strict";

const BaseStep = require('kronos-step').Step;

// The key of a registered logger.
// The service is an initialized step
const KEY_REGISTER_SERVICE_LOGGER = "kronos-logger-default:config";
const DEFAULT_LOGGER_DEFINITION = {
	"name": "default-logger",
	"type": "kronos-step-loger"
};

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
			try {
				steps.set(subStepName, manager.createStepInstanceFromConfig(subStepDefinition, manager));
			} catch (e) {
				manager.error(e);
			}
		}

		props.steps = {
			value: steps
		};
	},

	/**
	 * The flow has no real endpoints. It only has proxies.
	 * So just return the configuration
	 * @param {Object} stepDefinition The step configuration
	 */
	createEndpoints(stepDefinition) {
		if (stepDefinition && stepDefinition.endpoints) {
			for (const endpointName in stepDefinition.endpoints) {
				this.endpoints[endpointName] = stepDefinition.endpoints[endpointName];
			}
		}
		this._connectEndpoints(stepDefinition);
		this._assignLogger(stepDefinition);
	},

	_connectEndpoints(stepDefinition) {
		const steps = this.steps;
		const name = this.name;
		const endpoints = this.endpoints;
		//----------------------------------------------
		//-- set the target endpoints
		//----------------------------------------------
		for (const subStepName in stepDefinition.steps) {
			const step = steps.get(subStepName);
			const subStepDefinition = stepDefinition.steps[subStepName];

			if (subStepDefinition.endpoints) {
				for (const endpointName in subStepDefinition.endpoints) {
					const endpointConfig = subStepDefinition.endpoints[endpointName];

					const endpoint = step.endpoints[endpointName];

					let target = endpointConfig.target;
					if (typeof endpointConfig === 'string') {
						target = endpointConfig;
					} else if (typeof endpointConfig === 'object') {
						target = endpointConfig.target;
					}

					let res;
					if (target && typeof target === 'string') {
						if (res = target.match(/^(.+)\/(.+)/)) { // optional step:
							const targetStepName = res[1];
							const targetEndpointName = res[2];
							let targetStep = steps.get(targetStepName);

							if (!targetStep && targetStepName === name) {
								// Nothing to do. The step references the flow itself. This will be handled next
							} else if (targetStep) {
								const targetEndpoint = targetStep.endpoints[targetEndpointName];
								if (targetEndpoint) {
									if (endpoint.isOut) {
										endpoint.connected = targetEndpoint;
									} else if (targetEndpoint.isOut) {
										targetEndpoint.connected = endpoint;
									}
								} else {
									// TODO is manager the right target here ?
									manager.error(`Target endpoint '${targetEndpointName}' not found in step '${targetStepName}'`);
								}
							} else {
								manager.error(`Target step '${targetStepName}' not found`);
							}
						} else {
							manager.error(`Endpoint target '${endpoint.target}' of endpoint '${endpointName}' is not of right format`);
						}
						//console.log(`${step}: ${e.target}: ${res[1]} ${res[2]} ${targetStep} ${targetEndpoint}`);
					}
				}
			}
		}

		//----------------------------------------------
		//-- get the original endpoints for the Flow.
		//----------------------------------------------
		/*
		 * A flow has only endpoint proxies. These will be replaced by the original endpoints
		 * of the sub steps
		 */
		let res;
		for (const endpointName in endpoints) {
			const endpoint = endpoints[endpointName];
			if (typeof endpoint === 'string') {
				if (res = endpoint.match(/^(.+)\/(.+)/)) { // optional step:
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
							manager.error(`Target endpoint '${targetEndpointName}' not found in step '${targetStepName}'`);
						}
					} else {
						manager.error(`Target step '${targetStepName}' not found`);
					}
				} else {
					manager.error(`Endpoint target '${endpoint}' of endpoint '${endpointName}' is not of right format`);
				}
			} else {
				if (!endpoint.default) {
					manager.error(`Flow endpoint '${endpointName}' in flow '${name}' is not of type 'string'`);
				}
			}
		}
	},


	/**
	 * Assign a logger step to each of the steps in the flow.
	 * It will only assign the default logger if the log endPoint is not
	 * already connected.
	 * @param {map} steps All the steps of the flow
	 */
	_assignLogger() {
		// get the config from the service manager
		let loggerStep;
		loggerStep = this.manager.serviceGet(KEY_REGISTER_SERVICE_LOGGER);

		if (!loggerStep) {
			try {
				loggerStep = this.manager.getStepInstance(DEFAULT_LOGGER_DEFINITION);
			} catch (err) {
				// do nothing. If no step is registered it is OK
			}
			if (loggerStep) {
				// store the step as the default logger
				this.manager.serviceRegister(KEY_REGISTER_SERVICE_LOGGER, loggerStep);
			}
		}

		if (loggerStep) {
			const logEndpoint = loggerStep.endpoints.in;

			// ok, assign the logger
			for (const step of this.steps.values()) {
				if (!step.endpoints.log.isConnected) {
					step.endpoints.log.connected = logEndpoint;
				}
			}
		}
	},


	_start() {
		const sbt = stepsByType(this.steps);
		return Promise.all(sbt.normalSteps.map(s => s.start())).then(() =>
			Promise.all(sbt.inboundSteps.map(s => s.start()))
		);
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
 */
function loadFlows(manager, jsonFlowDefinition) {
	const promises = [];
	for (const flowName in jsonFlowDefinition) {
		const singleFlowDefinition = jsonFlowDefinition[flowName];

		singleFlowDefinition.type = "kronos-flow";
		singleFlowDefinition.name = flowName;

		const flow = manager.createStepInstanceFromConfig(singleFlowDefinition, manager);
		promises.push(manager.registerStep(flow));
		promises.push(manager.registerFlow(flow));
	}

	return Promises.all(promises);
}

module.exports.FlowFactory = Object.assign({}, BaseStep, Flow);
module.exports.loadFlows = loadFlows;
