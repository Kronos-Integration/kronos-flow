/* global describe, it, beforeEach */
/* jslint node: true, esnext: true */
"use strict";

const chai = require('chai'),
	assert = chai.assert,
	expect = chai.expect,
	should = chai.should(),
	stepPassThrough = require('kronos-step-passthrough'),
	serviceManager = require('kronos-service-manager'),
	testStep = require('kronos-test-step'),
	Flow = require('../lib/flow'),
	step = require('kronos-step');


// ---------------------------
// Create a mock manager
// ---------------------------
const managerPromise = serviceManager.manager().then(manager =>
	Promise.all([
		manager.registerStep(Flow.FlowFactory),

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

			// TODO why does "can be stopped while starting" not work
			_stop() {
				return new Promise((fulfill, reject) =>
					setTimeout(() => fulfill(this), this.time));
			}
		})),
	]).then(() =>
		Promise.resolve(manager)
	));


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

describe('flow', function () {
	describe('static', function () {

		it("autostart is false", function () {
			return managerPromise.then(manager => {
				// load the content of the flow definition
				return Flow.loadFlows(manager, dummyFlow).then(() => {
					const f = manager.flows.myFlowName;
					assert.ok(f);
					assert.equal(f.name, "myFlowName");
					assert.equal(f.autostart, false);
					return Promise.resolve("OK");
				});
			});
		});

		it("autostart is true", function () {
			return managerPromise.then(manager => {
				// load the content of the flow definition
				return Flow.loadFlows(manager, autoStartFlow).then(() => {
					const f = manager.flows.myAutoStartFlow;
					assert.ok(f);
					assert.equal(f.name, "myAutoStartFlow");
					assert.equal(f.autostart, true);
					return Promise.resolve("OK");
				});
			});
		});
	});
});

// describe('livecycle', function () {
// 	testStep.checkStepLivecycle(manager, f);
// });
//
// 	const f2 = manager.getFlow("autostartFlow");
//
// 	it("is set", function () {
// 		assert.equal(f2.autostart, true);
// 	});
// 	//testStep.checkStepStatic(manager, f2);
// });
