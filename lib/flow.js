/* jslint node: true, esnext: true */
"use strict";

const Step = require('kronos-step');

/**
 * This is the flow implementation.
 * It holds all the steps.
 */
module.exports = {
	"name": "kronos-flow",
	"description": "General step collection",

	finalize(manager, scopeReporter, stepConfiguration) {},


	/**
	 * The flow has no real endpoints. It only has proxies.
	 * So just return the configuration
	 */
	_createEndpoints(scopeReporter, impl, def) {
		const endpoints = impl.endpoints;

		if (def.endpoints) {
			for (const endpointName in def.endpoints) {
				endpoints[endpointName] = def.endpoints[endpointName];
			}
		}

		return endpoints;
	},



	/**
	 *
	 * @param manager {object} The kronos-service-manager
	 * @param scopeReporter {object} The scope reporter
	 * @param name {string} The name of this step
	 * @param stepDefinition {object} The definition used to create the step
	 * @param endpoints {object} The endpoints of this step
	 * @param props {object} The properties of the new object
	 */
	initialize(manager, scopeReporter, name, stepDefinition, endpoints, props) {
		// All steps
		const steps = new Map();

		//----------------------------------------------
		//-- Create the sub steps
		//----------------------------------------------
		for (const subStepName in stepDefinition.steps) {
			const subStepDefinition = stepDefinition.steps[subStepName];
			subStepDefinition.name = subStepName;
			const subStep = manager.getStepInstance(subStepDefinition);
			steps.set(subStepName, subStep);
		}

		//----------------------------------------------
		//-- set the target endpoints
		//----------------------------------------------
		for (const step of steps.values()) {
			scopeReporter.enterScope('step', step.name);

			for (const endpointName in step.endpoints) {
				scopeReporter.enterScope('endpoint', endpointName);

				const endpoint = step.endpoints[endpointName];

				let res;
				if (typeof endpoint.target === 'string') {

					if (res = endpoint.target.match(/^(.+)\/(.+)/)) { // optional step:
						const targetStepName = res[1];
						const targetEndpointName = res[2];
						let targetStep = steps.get(targetStepName);

						if (targetStep) {
							const targetEndpoint = targetStep.endpoints[targetEndpointName];
							if (targetEndpoint) {
								endpoint.target = targetEndpoint;
							} else {
								scopeReporter.error(`Target endpoint '${targetEndpointName}' not found in step '${targetStepName}'`, 'step',
									targetEndpointName);
							}
						} else {
							scopeReporter.error(`Target step '${targetStepName}' not found`, 'step', targetStepName);
						}
					} else {
						scopeReporter.error(`Endpoint target '${endpoint.target}' of endpoint '${endpointName}' is not of right format`,
							'step', step.name);
					}
					//console.log(`${step}: ${e.target}: ${res[1]} ${res[2]} ${targetStep} ${targetEndpoint}`);
				}
				scopeReporter.leaveScope('endpoint');
			}
			scopeReporter.leaveScope('step');
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

					if (targetStep) {
						const targetEndpoint = targetStep.endpoints[targetEndpointName];
						if (targetEndpoint) {
							endpoints[endpointName] = targetEndpoint;
						} else {
							scopeReporter.error(`Target endpoint '${targetEndpointName}' not found in step '${targetStepName}'`, 'step',
								targetEndpointName);
						}
					} else {
						scopeReporter.error(`Target step '${targetStepName}' not found`, 'step', name);
					}
				} else {
					scopeReporter.error(`Endpoint target '${endpoint}' of endpoint '${endpointName}' is not of right format`,
						'step', name);
				}
			} else {
				if (!endpoint.default) {
					scopeReporter.error(`Flow endpoint '${endpointName}' in flow '${name}' is not of type 'string'`, 'step', name);
				}
			}
		}


		props.steps = {
			value: steps
		};
	},

	_start() {
		// The inbound steps will be started last
		const normalStepPromises = [];
		const inboundSteps = [];

		// Sort the steps
		for (const subStep of this.steps.values()) {
			if (subStep.inbound) {
				inboundSteps.push(subStep);
			} else {
				normalStepPromises.push(subStep.start());
			}
		}

		return Promise.all(normalStepPromises).then(function () {
			return Promise.all(inboundSteps.map(s => s.start()));
		});
	},

	_stop() {
		// The inbound steps will be stopped first
		const normalSteps = [];
		const inboundStepPromises = [];

		// Sort the steps
		for (const subStep of this.steps.values()) {
			if (subStep.inbound) {
				inboundStepPromises.push(subStep.stop());
			} else {
				normalSteps.push(subStep);
			}
		}

		return Promise.all(inboundStepPromises).then(function () {
			return Promise.all(normalStep.map(s => s.stop()));
		});
	},

	_remove() {
		return Promise.all(mapForEachValue(this.steps, s => s.remove()));
	},

	/**
	 * Deliver json representation
	 * @param {Objects} options
	 * @return json representation
	 */
	toJSONWithOptions(options) {

		const prototype = Object.getPrototypeOf(this);
		const json = prototype.toJSONWithOptions(options);
		json.steps = {};

		for (const subStepName of this.steps.values()) {
			json.steps[subStepName.name] = subStepName.toJSONWithOptions(options);
		}

		return json;
	}
};

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
 * @param scopeReporter {object} The scope reporter
 * @param jsonFlowDefinition {object} The flow definition
 */
function loadFlows(manager, scopeReporter, jsonFlowDefinition) {
	for (let flowName in jsonFlowDefinition) {
		const singleFlowDefinition = jsonFlowDefinition[flowName];

		singleFlowDefinition.type = "kronos-flow";
		singleFlowDefinition.name = flowName;

		const flow = manager.getStepInstance(singleFlowDefinition);

		manager.registerStepImplementation(flow);
		manager.registerFlow(flow);
	}
}

module.exports.loadFlows = loadFlows;
