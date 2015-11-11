/* global describe, it, beforeEach */
/* jslint node: true, esnext: true */
"use strict";

const chai = require('chai'),
	assert = chai.assert,
	expect = chai.expect,
	should = chai.should(),
	scopeReporter = require('scope-reporter'),
	events = require('events'),
	stepPassThrough = require('kronos-step-passthrough'),
	testStep = require('kronos-test-step'),
	flow = require('../lib/flow'),
	step = require('kronos-step');


// ---------------------------
// Create a mock manager
// ---------------------------
const manager = testStep.managerMock;

// register the flow
flow.registerWithManager(manager);

// register the passthroughStep
stepPassThrough.registerWithManager(manager);

// create 5 copies and register them also
for (let i = 1; i < 6; i++) {
	const step = manager.getStepInstance({
		"type": "kronos-step-passthrough",
		"name": "Step_" + i
	});
	manager.registerStepImplementation(step);
}

/**
 * A dummy step for flow testing. The step will execute the stop
 * and start command after the given amaount of time
 * @param stepName The name of this step
 * @param time The time in millisecond it will last until the promise is fullfilled
 */
const DummyStep = {
	"name": "dummy",

	_initialize(manager, scopeReporter, name, stepConfiguration, endpoints, props) {
		props.time = {
			value: stepConfiguration.time
		};
		console.log(`DummyStep: time: ${stepConfiguration.time}`);
	},

	_start() {
		let self = this;
		return new Promise(function (fulfill, reject) {
			setTimeout(() => {
					console.log(`Started the step '${self.name}'`);
					fulfill(self);
				},
				self.time);
		});
	},

	_stop() {
		let self = this;
		return new Promise(function (fulfill, reject) {
			setTimeout(() => {
				console.log(`Stopped the step '${self.name}'`);
				fulfill(self);
			}, self.time);
		});
	}
};

manager.registerStepImplementation(DummyStep);


describe('livecycle', function () {

	// load the content of the flow definition
	flow.loadFlows(manager, manager.scopeReporter, {
		"myFlowName": {
			"type": "kronos-flow",
			"steps": {
				"slowInbound": {
					"type": "dummy",
					"time": 50
				},
				"normal": {
					"type": "dummy",
					"time": 10
				},
				"slowOutbound": {
					"type": "dummy",
					"time": 70
				}
			}
		}
	});

	const testFlow = manager.getFlow("myFlowName");


	testStep.checkStepLivecycle(manager, testFlow, function (step, state) {});
});
