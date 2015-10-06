/* global describe, it, beforeEach */
/* jslint node: true, esnext: true */
"use strict";

const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;
const should = chai.should();

const flowFactory = require('../lib/flow');
const STATUS = require('../lib/const-flow-status.js');


let testFlow;

/**
 * A dummy step for flow testing. The step will execute the stop
 * and start command after the given amaount of time
 * @param stepName The name of this step
 * @param time The time in millisecond it will last until the promise is fullfilled
 */
class DummyStep {
	constructor(stepName, time) {
		this.name = stepName;
		this.time = time;
	}

	start() {
		let self = this;
		self.status = STATUS.starting;
		return new Promise(function (fulfill, reject) {
			setTimeout(function () {
				self.status = STATUS.running;
				fulfill(`Started the step '${self.name}'`);
			}, self.time);
		});
	}

	stop() {
		let self = this;
		self.status = STATUS.stopping;
		return new Promise(function (fulfill, reject) {
			setTimeout(function () {
				self.status = STATUS.stopped;
				fulfill(`Stopped the step '${self.name}'`);
			}, self.time);
		});
	}
}


describe('flow: Start and stop', function () {

	beforeEach(function () {
		testFlow = flowFactory({}, {
			"name": "myFlowname"
		});
		testFlow.status = STATUS.stopped;

		testFlow.steps = {};
		testFlow.inboundSteps = [];

		let step1 = new DummyStep('slowInbound', 50);
		testFlow.steps.slowInbound = step1;
		testFlow.inboundSteps.push(step1);

		let step2 = new DummyStep('normal', 10);
		testFlow.steps.normal = step2;

		let step3 = new DummyStep('slowOutbound', 70);
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


/**
 * Creates a dummy step for flow testing. The step will execute the stop
 * and start command after the given amaount of time
 *
 * @param stepName The name of this step
 * @param time The time in millisecond it will last until the promise is fullfilled
 */
function stepCreator(stepName, time) {
	return new DummyStep(stepName, time);
}
