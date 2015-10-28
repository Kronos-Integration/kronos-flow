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

	/**
	 *
	 * @param manager {object} The kronos-service-manager
	 * @param scopeReporter {object} The scope reporter
	 * @param name {string} The name of this step
	 * @param stepDefinition {object} The definition used to create the step
	 * @param endpoints {object} The endpoints of this step
	 * @param props {object} The properties of the new object
	 */
	_initialize(manager, scopeReporter, name, stepDefinition, endpoints, props) {
		// All steps
		const steps = new Map();

		//----------------------------------------------
		//-- Create the sub steps
		//----------------------------------------------
		for (const subStepName in stepDefinition.steps) {
			const subStepDefinition = stepDefinition.steps[subStepName];
			const subStep = Step.createStep(manager, scopeReporter, subStepDefinition, subStepName);
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

					if (res = endpoint.target.match(/^flow:(.*)/)) {
						// connect to the endpoint of the parent
						const targetEndpointName = res[1];

						// targetStep = der parent (also dieser step selbst)
						const targetEndpoint = endpoints[targetEndpointName];
						if (targetEndpoint) {
							endpoint.target = targetEndpoint;
						} else {
							scopeReporter.error(`Target endpoint '${targetEndpointName}' not found in step '${name}'`, 'step',
								targetEndpointName);
						}
					} else if (res = endpoint.target.match(/^(step:)?(.+)\/(.+)/)) { // optional step:
						const targetStepName = res[2];
						const targetEndpointName = res[3];
						const targetStep = steps.get(targetStepName);

						if (targetStep) {
							const targetEndpoint = targetStep.endpoints[targetEndpointName];
							if (targetEndpoint) {
								endpoint.target = targetEndpoint;
							} else {
								scopeReporter.error(`Target endpoint '${targetEndpointName}' not found in step '${targetStepName}'`, 'step',
									targetEndpointName);
							}
						} else {
							scopeReporter.error('Target step not found', 'step', targetStepName);
						}
					}
					//console.log(`${step}: ${e.target}: ${res[1]} ${res[2]} ${targetStep} ${targetEndpoint}`);
				}
				scopeReporter.leaveScope('endpoint');
			}
			scopeReporter.leaveScope('step');
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
			let inboundPromises = [];
			inboundSteps.forEach(function (inboundStep) {
				inboundPromises.push(inboundStep.start());
			});
			return Promise.all(inboundPromises);
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
			let normalStepPromises = [];
			normalSteps.forEach(function (normalStep) {
				normalStepPromises.push(normalStep.stop());
			});
			return Promise.all(normalStepPromises);
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

		for (const s of this.steps.values()) {
			json.steps[s.name] = s.toJSONWithOptions(options);
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
