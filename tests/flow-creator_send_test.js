/* global describe, it, xit, before, beforeEach, after, afterEach */
/* jslint node: true, esnext: true */
"use strict";

const chai = require('chai'),
	assert = chai.assert,
	expect = chai.expect,
	should = chai.should(),
	fs = require('fs'),
	path = require('path'),
	ksm = require('kronos-service-manager'),
	testStep = require('kronos-test-step'),
	step = require('kronos-step'),
	endpoint = require('kronos-endpoint'),
	stepPassThrough = require('kronos-step-passthrough'),
	messageFactory = require('kronos-message').createMessage,
	Flow = require('../index.js');

const fixturesDir = path.join(__dirname, 'fixtures');

// ---------------------------
// Create a mock manager
// ---------------------------
const managerPromise = ksm.manager().then(manager =>
	Promise.all([
		Flow.registerWithManager(manager),

		// register the passthroughStep
		stepPassThrough.registerWithManager(manager),

	]).then(() =>
		Promise.resolve(manager)
	));

// ---------------------------
// load example flow
// ---------------------------



describe('flow: send message', () => {
	// it('flow_one_step.json', function () {
	// 	return flowTest('flow_one_step.json', 'flowOne');
	// });
	//
	// it('flow_two_steps.json', function () {
	// 	return flowTest('flow_two_steps.json', 'flowTwoSteps');
	// });

	it('flow_nested_level1.json', () => flowTest('flow_nested_level1.json', 'nestedLevel1'));

	// it('flow_nested_complex.json', function () {
	// 	return flowTest('flow_nested_complex.json', 'nestedComplex');
	// });
});



/**
 * This function takes the flow and sends a message through it. Important is that the
 * flow itself has two endpoints with the name 'inFile' and 'outFile'. These endpoints
 * will be used to send and receive the message.
 * @param flowFileName The filename of the flow json.
 * @param flowName The name of the flow in the file
 * @param done The done callback.
 * @return promise
 */
function flowTest(flowFileName, flowName) {

	return managerPromise.then(manager => {

		// load the json file
		const flowDefintion = require(path.join(fixturesDir, flowFileName));

		// load the content of the flow definition
		return Flow.loadFlows(manager, flowDefintion).then(() => {

			// get the flow from the manager
			const myFlow = manager.flows[flowName];

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
			let receiveEndpoint = new endpoint.ReceiveEndpoint("testEndpointIn");

			// This endpoint is the OUT endpoint of the previous step.
			// It will be connected with the OUT endpoint of the Adpater
			let sendEndpoint = new endpoint.SendEndpoint("testEndpointOut");

			// This generator emulates the IN endpoint of the next step.
			// It will be connected with the OUT endpoint of the Adpater
			let receiveFunction = message => {
				// the received message should equal the sended one
				// before comparing delete the hops
				message.hops = [];

				assert.deepEqual(message, msgToSend);
				return Promise.resolve("OK");
			};

			receiveEndpoint.receive = receiveFunction;
			outEndPoint.connected = receiveEndpoint;
			sendEndpoint.connected = inEndPoint;

			return myFlow.start().then(step => sendEndpoint.receive(msgToSend));
		});
	});
}
