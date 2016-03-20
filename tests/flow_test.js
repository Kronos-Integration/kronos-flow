/* global describe, it, xit, before, beforeEach, after, afterEach */
/* jslint node: true, esnext: true */
"use strict";

const chai = require('chai'),
	assert = chai.assert,
	expect = chai.expect,
	should = chai.should(),
	ksm = require('kronos-service-manager'),
	testStep = require('kronos-test-step'),
	Flow = require('../lib/flow'),
	step = require('kronos-step');

describe('flow', () => {
	let manager;

	before('prepare manager', done => {
		ksm.manager({}, [require('../index')]).then(m => {
			manager = m;

			/**
			 * A dummy step for flow testing. The step will execute the stop
			 * and start command after the given amount of time
			 * @param stepName The name of this step
			 * @param time The time in millisecond it will last until the promise is fullfilled
			 */
			manager.registerStep(Object.assign({}, step.Step, {
				"name": "slow-start",

				initialize(manager, name, stepConfiguration, props) {
					props.time = {
						value: stepConfiguration.time
					};
					//console.log(`DummyStep: time: ${stepConfiguration.time}`);
				},

				_start() {
					//console.log(`start: ${this.name} ${this.time}`);

					return new Promise((fulfill, reject) =>
						setTimeout(() => fulfill(this), this.time));
				},

				_stop() {
					return new Promise((fulfill, reject) =>
						setTimeout(() => fulfill(this), this.time));
				}
			})).then(() => done());
		});
	});

	describe('autostart', () => {
		it("is false", () =>
			Flow.loadFlows(manager, {
				"myFlow": {
					"type": "kronos-flow",
					"steps": {
						"slowInbound": {
							"type": "slow-start",
							"time": 10
						}
					}
				}
			}).then(() => {
				const f = manager.flows.myFlow;
				assert.equal(f.name, "myFlow");
				assert.equal(f.autostart, false);
			})
		);

		it("is true", () =>
			Flow.loadFlows(manager, {
				"myAutoStartFlow": {
					"type": "kronos-flow",
					"autostart": true,
					"steps": {
						"slowInbound": {
							"type": "slow-start",
							"time": 10
						}
					}
				}
			}).then(() => {
				const f = manager.flows.myAutoStartFlow;
				assert.equal(f.name, "myAutoStartFlow");
				assert.equal(f.autostart, true);
			})
		);
	});

	describe('connections', () => {
		describe('service', () => {
			describe('optional', () => {
				it("create", done => {
					const s = manager.createStepInstanceFromConfig({
						"name": "myFlowName",
						"type": "kronos-flow",
						"steps": {
							"with-service": {
								"type": "slow-start",
								"endpoints": {
									"optional": {
										"in": true,
										"target": "aService:a1",
										"mandatory": false
									}
								}
							}
						}
					}, manager);
					s.start().then(() => s.stop().then(() => done()));
				});
			});
			describe('mandatory', () => {
				describe('present', () => {
					it("create", done => {
						const s = manager.createStepInstanceFromConfig({
							"name": "myFlowName",
							"type": "kronos-flow",
							"steps": {
								"with-service": {
									"type": "slow-start",
									"endpoints": {
										"mandatory": {
											"out": true,
											"target": "config:config"
										}
									}
								}
							}
						}, manager);
						s.start().then(() => s.stop().then(() => done()));
					});
				});

				describe('missing service', () => {
					it("create", () => {
						try {
							manager.createStepInstanceFromConfig({
								"name": "myFlowName",
								"type": "kronos-flow",
								"steps": {
									"with-service": {
										"type": "slow-start",
										"endpoints": {
											"mandatory": {
												"in": true,
												"target": "aService:a1",
												"mandatory": true
											}
										}
									}
								}
							}, manager);
						} catch (e) {
							assert.match(e, /Service 'aService' not found/);
						}
					});
				});
				describe('missing service endpoint', () => {
					it("create", () => {
						try {
							manager.createStepInstanceFromConfig({
								"name": "myFlowName",
								"type": "kronos-flow",
								"steps": {
									"with-service": {
										"type": "slow-start",
										"endpoints": {
											"mandatory": {
												"in": true,
												"target": "config:a1"
											}
										}
									}
								}
							}, manager);
						} catch (e) {
							assert.match(e, /service 'config' not found/);
						}
					});
				});
			});
		});

		describe('step', () => {
			describe('mandatory', () => {
				describe('missing step', () => {
					it("create", () => {
						try {
							manager.createStepInstanceFromConfig({
								"name": "myFlowName",
								"type": "kronos-flow",
								"steps": {
									"s1": {
										"type": "slow-start",
										"endpoints": {
											"mandatory": {
												"in": true,
												"target": "aStep/a1",
												"mandatory": true
											}
										}
									}
								}
							}, manager);
						} catch (e) {
							assert.match(e, /Step 'aStep' not found/);
						}
					});
				});
				describe('missing step endpoint', () => {
					it("create", () => {
						try {
							manager.createStepInstanceFromConfig({
								"name": "myFlowName",
								"type": "kronos-flow",
								"steps": {
									"s1": {
										"type": "slow-start",
										"endpoints": {
											"mandatory": {
												"in": true,
												"target": "s1/a1",
											}
										}
									}
								}
							}, manager);
						} catch (e) {
							assert.match(e, /step 's1' not found/);
						}
					});
				});
			});
		});

		before(done =>
			Flow.loadFlows(manager, {
				"myFlowName": {
					"type": "kronos-flow",
					"steps": {
						"normal": {
							"type": "slow-start",
							"time": 5
						}
					}
				}
			}).then(() => done())
		);

		it("basic", done => {
			const s = manager.flows.myFlowName;
			s.start().then(() => s.stop().then(() => {
				done();
			}));
		});
	});
});
