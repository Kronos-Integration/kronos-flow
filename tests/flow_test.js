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


let manager;

before(done => {
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
	describe('static', () => {
		it("autostart is false", () =>
			Flow.loadFlows(manager, dummyFlow).then(() => {
				const f = manager.flows.myFlowName;
				assert.ok(f);
				assert.equal(f.name, "myFlowName");
				assert.equal(f.autostart, false);
			})
		);

		it("autostart is true", () =>
			Flow.loadFlows(manager, autoStartFlow).then(() => {
				const f = manager.flows.myAutoStartFlow;
				assert.ok(f);
				assert.equal(f.name, "myAutoStartFlow");
				assert.equal(f.autostart, true);
			})
		);
	});

	describe('livecycle', () => {
		console.log(`A ${manager}`);
		it("basic", done =>
			Flow.loadFlows(manager, dummyFlow).then(() => {
				try {
					testStep.checkStepLivecycle(manager, manager.flows.myFlowName, (step, state, livecycle, done) => {
						console.log('B');
						done();
					});
				} catch (e) {
					console.log(e);
				}
				setTimeout(() => done(), 100);
				//done();
			})
		);
	});
});
