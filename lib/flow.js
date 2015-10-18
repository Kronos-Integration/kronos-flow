/* jslint node: true, esnext: true */
"use strict";

const stepImpl = require('kronos-step');

/**
 * This is the flow implementation.
 * It holds all the steps.
 */
class Flow extends BaseStep {
	/**
	 * Adds a new step to the flow
	 * @param step The step to be added.
	 */
	addStep(step) {
		this.steps[step.name] = step;
		step.flow = this;
	}

	/**
	 * Starts this flow. First start all steps but the 'inboundSteps'.
	 * After all the steps are sterted, start the 'inboundSteps' also.
	 * The flow could only be started if the flow is in the status ''stopped''
	 * @return Promise
	 */
	start() {
			const self = this;

			// only start if the flow is stopped
			if (self.status.name !== STATUS.stopped.name) {
				return new Promise(function (fulfill, reject) {
					reject("The flow is not in status 'stopped', so it could not be started.");
				});
			}

			self.status = STATUS.starting;

			// stores all the promisses from the starting steps
			let startingSteps = [];

			let inboundSteps = {};
			for (let i = 0; i < self.inboundSteps.length; i++) {
				let step = self.inboundSteps[i];

				inboundSteps[step.name] = step;
			}

			// first start all the NOT inboundSteps
			for (let stepName in self.steps) {
				if (!inboundSteps[stepName]) {
					startingSteps.push(self.steps[stepName].start());
				}
			}

			return Promise.all(startingSteps).then(function (values) {
						// Now the normal steps where started.
						startingSteps = [];

						// now start the inbound steps
						for (let i = 0; i < self.inboundSteps.length; i++) {
							let step = self.inboundSteps[i];
							startingSteps.push(step.start()); === === =
							class Flow extends step.Step {

								_initialize(scopeReporter, def, imp) {
										const steps = new Map();

										for (const name in def.steps) {
											steps.set(stepImpl.createStep(this.manager, scopeReporter, def.steps[name], name)); >>> >>> > 5e5 c22bba9733fe56322569e6f80c50dc269cca6
										}

										for (const step of steps.values()) {
											sr.enterScope('step', step.name);

											for (const en in step.endpoints) {
												sr.enterScope('endpoint', en);

												const e = step.endpoints[en];
												//console.log(`**** ${JSON.stringify(e.target)}`);
												let res;
												if (util.isString(e.target))
													if (res = e.target.match(/^([^\/]+)\/(.*)/)) {
														const targetStep = steps.get(res[1]);

														if (targetStep) {
															const targetEndpoint = targetStep.endpoints[res[2]];
															if (targetEndpoint) {
																e.setTarget(targetEndpoint);
															} else {
																sr.error('Target endpoint not found', 'step', sid, res[2]);
															}
														} else {
															sr.error('Target step not found', 'step', sid, res[1]);
														}
														//console.log(`${step}: ${e.target}: ${res[1]} ${res[2]} ${targetStep} ${targetEndpoint}`);
													}
												sr.leaveScope('endpoint');
											}
											sr.leaveScope('step');
										}

										// TODO do it even later
										this.steps = steps;
									},

									_start() {
										return Promise.all(MapForEachValue(this.steps, s => s.start()));
									},

									_stop() {
										return Promise.all(MapForEachValue(this.steps, s => s.stop()));
									},
							}

							Flow.configuration = {
								"name": "kronos-flow",
								"description": "General step collection"
							};


							/**
							 * Calls function on each map entry and delivers function reults as an iterable.
							 * @param {Map} map
							 * @param {Function} f
							 * @return {Iterator} result of calling f on each map entry
							 * @api private
							 */
							function MapForEachValue(map, f) {
								const r = [];

								for (const i of map.values()) {
									r.push(f(i));
								}
								return r;
							}

							module.exports = Flow;
