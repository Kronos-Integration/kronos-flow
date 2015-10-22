/* global describe, it, beforeEach */
/* jslint node: true, esnext: true */
"use strict";

const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;
const should = chai.should();

const Flow = require('../lib/flow');
const step = require('kronos-step');


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
		this.time = stepConfiguration.time;
	},

	_start() {
		let self = this;
		return new Promise(function (fulfill, reject) {
			setTimeout(() =>
				fulfill(`Started the step '${self.name}'`), self.time);
		});
	},

	_stop() {
		let self = this;
		return new Promise(function (fulfill, reject) {
			setTimeout(() =>
				fulfill(`Stopped the step '${self.name}'`), self.time);
		});
	}
};


describe('flow: Start and stop', function () {

	beforeEach(function () {
		const testFlow = step.createStep(manager, sr, {
			"name": "myFlowname",
			type: "kronos-flow",
			steps: {
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
		}, "myname");

		testFlow.steps.slowInbound = step1;
		testFlow.inboundSteps.push(step1);

		testFlow.steps.normal = step2;

		testFlow.steps.slowOutbound = step3;
	});


	it('Flow in status stopped to be started', function (done) {
		testFlow.start().then(function (msg) {
			assert.equal(testFlow.status.name, STATUS.running.name);
			assert.equal(msg.name, STATUS.running.name);
			done();
		});
	});

	it('Flow in status running to be stopped', function (done) {
		testFlow.status = STATUS.running;

		testFlow.stop().then(function (msg) {
			assert.equal(testFlow.status.name, STATUS.stopped.name);
			assert.equal(msg.name, STATUS.stopped.name);
			done();
		});
	});


	it("Try to start a flow not in status 'stopped'", function (done) {
		testFlow.status = STATUS.running;

		testFlow.start().then(function (msg) {
			assert.ok(false, "The promise should reject");
		}).catch(function (err) {
			assert.equal(err, "The flow is not in status 'stopped', so it could not be started.");
			done();
		});
	});

	it("Try to stop a flow not in status 'running'", function (done) {
		testFlow.status = STATUS.stopping;

		testFlow.stop().then(function (msg) {
			assert.ok(false, "The promise should reject");
		}).catch(function (err) {
			assert.equal(err, "The flow is not in status 'running', so it could not be stopped.");
			done();
		});
	});
});
