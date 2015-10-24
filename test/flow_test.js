/* global describe, it, beforeEach */
/* jslint node: true, esnext: true */
"use strict";

const chai = require('chai'),
	assert = chai.assert,
	expect = chai.expect,
	should = chai.should(),
	scopeReporter = require('scope-reporter'),
	events = require('events'),
	testStep = require('kronos-test-step'),
	Flow = require('../lib/flow'),
	step = require('kronos-step');


const sr = scopeReporter.createReporter(step.ScopeDefinitions, function (reporter) {});

var stepImplementations = {};
const manager = Object.create(new events.EventEmitter(), {
	steps: {
		value: stepImplementations
	}
});

manager.registerStepImplementation = function (si) {
	const psi = step.prepareStepForRegistration(manager, sr, si);
	stepImplementations[psi.name] = psi;
};

manager.registerStepImplementation(Flow);

let testFlow;

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
	const testFlow = step.createStep(manager, sr, {
		"name": "myFlowName",
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
	});

	testStep.checkStepLivecycle(manager, testFlow, function (step, state) {});
});
