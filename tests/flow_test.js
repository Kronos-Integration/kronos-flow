/* global describe, it, beforeEach */
/* jslint node: true, esnext: true */
"use strict";

const chai = require('chai'),
	assert = chai.assert,
	expect = chai.expect,
	should = chai.should(),
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

/**
 * A dummy step for flow testing. The step will execute the stop
 * and start command after the given amaount of time
 * @param stepName The name of this step
 * @param time The time in millisecond it will last until the promise is fullfilled
 */
manager.registerStep(Object.assign({}, step.Step, {
	"name": "slow-start",

	initialize(manager, name, stepConfiguration, props) {
		props.time = {
			value: stepConfiguration.time
		};
	},

	_start() {
		const self = this;
		return new Promise((fulfill, reject) => {
			setTimeout(() => fulfill(self), self.time);
		});
	},

	// TODO why does "can be stopped while starting" not work
	__stop() {
		const self = this;
		return new Promise((fulfill, reject) => {
			setTimeout(() => fulfill(self), self.time);
		});
	}
}));

describe('flow', () => {
	// load the content of the flow definition
	flow.loadFlows(manager, {
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

	describe('static', () => {
		testStep.checkStepStatic(manager, f);
		it("autostart is false", () => assert.equal(f.autostart, false));
	});

	describe('livecycle', () => {
		testStep.checkStepLivecycle(manager, f);
	});

	describe('autostart', () => {
		flow.loadFlows(manager, {
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

		it("is set", () => assert.equal(f2.autostart, true));
		//testStep.checkStepStatic(manager, f2);
	});
});
