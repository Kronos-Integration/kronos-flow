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

const dummyFlow = {
	"myFlowName": {
		"type": "kronos-flow",
		"steps": {
			"slowInbound": {
				"type": "slow-start",
				"time": 10
			},
			"normal": {
				"type": "slow-start",
				"time": 5
			},
			"slowOutbound": {
				"type": "slow-start",
				"time": 70
			}
		}
	}
};

const autoStartFlow = {
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
};

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
					return new Promise((fulfill, reject) =>
						setTimeout(() => fulfill(this), this.time));
				},

				_stop() {
					return new Promise((fulfill, reject) =>
						setTimeout(() => fulfill(this), this.time));
				}
			}));
			done();
		});
	});

	describe('autostart', () => {
		it("is false", () =>
			Flow.loadFlows(manager, dummyFlow).then(() => {
				const f = manager.flows.myFlowName;
				assert.equal(f.name, "myFlowName");
				assert.equal(f.autostart, false);
			})
		);

		it("is true", () =>
			Flow.loadFlows(manager, autoStartFlow).then(() => {
				const f = manager.flows.myAutoStartFlow;
				assert.equal(f.name, "myAutoStartFlow");
				assert.equal(f.autostart, true);
			})
		);
	});

	describe('livecycle', () => {
		before(done => {
			console.log(`A ${manager}`);
			Flow.loadFlows(manager, dummyFlow).then(() => {
				done();
			});
		});

		it("basic", done => {
			try {
				console.log(`B ${manager}`);
				testStep.checkStepLivecycle(manager, manager.flows.myFlowName, (step, state, livecycle, done) => {
					console.log('C');
					done();
				});
			} catch (e) {
				console.log(e);
			}
			setTimeout(() => done(), 500);
		});
	});
});
