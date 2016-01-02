/* global describe, it, beforeEach */
/* jslint node: true, esnext: true */
"use strict";

const chai = require('chai'),
	assert = chai.assert,
	expect = chai.expect,
	should = chai.should(),
	//events = require('events'),
	stepPassThrough = require('kronos-step-passthrough'),
	testStep = require('kronos-test-step'),
	flow = require('../lib/flow'),
	step = require('kronos-step');


// ---------------------------
// Create a mock manager
// ---------------------------
const manager = testStep.managerMock;

// register the flow
require('../index').registerWithManager(manager);

/*
// register the passthroughStep
stepPassThrough.registerWithManager(manager);

// create 5 copies and register them also
for (let i = 1; i < 6; i++) {
	manager.registerStepImplementation(manager.getStepInstance({
		"type": "kronos-step-passthrough",
		"name": "Step_" + i
	}));
}
*/

/**
 * A dummy step for flow testing. The step will execute the stop
 * and start command after the given amaount of time
 * @param stepName The name of this step
 * @param time The time in millisecond it will last until the promise is fullfilled
 */
manager.registerStepImplementation(Object.assign({}, step.Step, {
	"name": "slow-start",

	initialize(manager, scopeReporter, name, stepConfiguration, props) {
		props.time = {
			value: stepConfiguration.time
		};
		//console.log(`DummyStep: time: ${stepConfiguration.time}`);
	},

	_start() {
		const self = this;
		return new Promise(function (fulfill, reject) {
			setTimeout(() => {
					//console.log(`Started the step '${self.name}'`);
					fulfill(self);
				},
				self.time);
		});
	},

	// TODO why does "can be stopped while starting" not work
	__stop() {
		const self = this;
		return new Promise(function (fulfill, reject) {
			setTimeout(() => {
				//console.log(`Stopped the step '${self.name}'`);
				fulfill(self);
			}, self.time);
		});
	}
}));

describe('flow', function () {
	// load the content of the flow definition
	flow.loadFlows(manager, manager.scopeReporter, {
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
	});

	const f = manager.getFlow("myFlowName");

	describe('static', function () {
		testStep.checkStepStatic(manager, f);

		it("autostart is false", function () {
			assert.equal(f.autostart, false);
		});
	});

	describe('livecycle', function () {
		testStep.checkStepLivecycle(manager, f);
	});

	describe('autostart', function () {
		flow.loadFlows(manager, manager.scopeReporter, {
			"autostartFlow": {
				"type": "kronos-flow",
				"autostart": true,
				"steps": {
					"slowInbound": {
						"type": "slow-start",
						"time": 10
					}
				}
			}
		});
		const f2 = manager.getFlow("autostartFlow");

		it("is set", function () {
			assert.equal(f2.autostart, true);
		});
		//testStep.checkStepStatic(manager, f2);
	});

});
