/* global describe, it, beforeEach */
/* jslint node: true, esnext: true */
"use strict";

const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;
const should = chai.should();

const events = require('events');
const testStep = require('kronos-test-step');

const fs = require('fs');
const path = require("path");

const fixturesDir = path.join(__dirname, 'fixtures');


const step = require('kronos-step');
const scopeDefinitions = step.ScopeDefinitions;
const scopeReporter = require('scope-reporter');
const stepPassThrough = require('kronos-step-passthrough');
const messageFactory = require('kronos-message');
const flow = require('../index.js');


// ---------------------------
// Create a mock manager
// ---------------------------
const manager = testStep.managerMock;

// register the flow
flow.registerWithManager(manager);

// register the passthroughStep
stepPassThrough.registerWithManager(manager);


// ---------------------------
// load example flow
// ---------------------------



describe('flow: send message', function () {
	it('flow_one_step.json', function (done) {
		flowTest('flow_one_step.json', 'flowOne', done);
	});

	it('flow_two_steps.json', function (done) {
		flowTest('flow_two_steps.json', 'flowTwoSteps', done);
	});

	it('flow_nested_level1.json', function (done) {
		flowTest('flow_nested_level1.json', 'nestedLevel1', done);
	});


	it('flow_nested_complex.json', function (done) {
		flowTest('flow_nested_complex.json', 'nestedComplex', done);
	});
});



/**
 * This function takes the flow and sends a message through it. Important is that the
 * flow itself has two endpoints with the name 'inFile' and 'outFile'. These endpoints
 * will be used to send and receive the message.
 * @param flowFileName The filename of the flow json.
 * @param flowName The name of the flow in the file
 * @param done The done callback.
 */
function flowTest(flowFileName, flowName, done) {
	// load the json file
	const flowDefintion = require(path.join(fixturesDir, flowFileName));

	// load the content of the flow definition
	flow.loadFlows(manager, manager.scopeReporter, flowDefintion);

	// get the flow from the manager
	const myFlow = manager.getFlow(flowName);


	const msgToSend = messageFactory({
		"file_name": "anyFile.txt"
	});

	msgToSend.payload = {
		"name": "pay load"
	};


	let inEndPoint = myFlow.endpoints.inFile;
	let outEndPoint = myFlow.endpoints.outFile;

	// This endpoint is the IN endpoint of the next step.
	// It will be connected with the OUT endpoint of the Adpater
	let receiveEndpoint = step.createEndpoint("testEndpointIn", {
		"in": true,
		"passive": true
	});

	// This endpoint is the OUT endpoint of the previous step.
	// It will be connected with the OUT endpoint of the Adpater
	let sendEndpoint = step.createEndpoint("testEndpointOut", {
		"out": true,
		"active": true
	});


	// This generator emulates the IN endpoint of the next step.
	// It will be connected with the OUT endpoint of the Adpater
	let generatorFunction = function* () {
		while (true) {
			const message = yield;

			// the received message should equal the sended one
			// before comparing delete the hops
			message.hops = [];

			assert.deepEqual(message, msgToSend);
			done();
		}
	};
	receiveEndpoint.setPassiveGenerator(generatorFunction);
	outEndPoint.connect(receiveEndpoint);
	inEndPoint.connect(sendEndpoint);

	myFlow.start().then(function (step) {
		sendEndpoint.send(msgToSend);
	}, function (error) {
		done(error); // 'uh oh: something bad happened’
	});

}
