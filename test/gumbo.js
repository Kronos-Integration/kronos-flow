/* global describe, it, beforeEach */
/* jslint node: true, esnext: true */
"use strict";

const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;
const should = chai.should();


const fs = require('fs');
const path = require("path");

const fixturesDir = path.join(__dirname, 'fixtures');


const flowCreatorFactory = require('../lib/flow-creator');
const Endpoint = require('kronos-step').endpoint;
const dumyStepFactory = require('kronos-step-passthrough');
const messageFactory = require('kronos-step').message;


let kronos;
let defaultMessage;


kronos = {};
kronos.steps = {};
kronos.steps.Step_1 = dumyStepFactory;
kronos.steps.Step_2 = dumyStepFactory;
kronos.steps.Step_3 = dumyStepFactory;
kronos.steps.Step_4 = dumyStepFactory;
kronos.steps.Step_5 = dumyStepFactory;

defaultMessage = messageFactory({
	"my": "name"
});

// Create the flow which will be used as a step in the next flow
let flowDefintionStep = require(path.join(fixturesDir, 'flow_with_endpoints.json'));
let flow = flowCreatorFactory(kronos, flowDefintionStep)[0];


testObject(kronos, 'flow_using_flow_as_step.json', defaultMessage);



/**
 * This function creates a flow obect out of the given json definition.
 * Then it will send a message through the flow and checks that the message
 * will arrive at the out endpoint
 * @param kronos The kronos object which holds the step definitions
 * @param flowDefinitionJsonFile The filename of the json file to load. Relative to the fixtures directory.
 * @param sourceMessage The message to be send through the flow
 * @param done The 'done' callback
 */
function testObject(kronos, flowDefinitionJsonFile, sourceMessage) {
	let flowDefintion = require(path.join(fixturesDir, flowDefinitionJsonFile));


	// Create the flow objects and get the first one
	let flow = flowCreatorFactory(kronos, flowDefintion)[0];

	console.log(flow);

	// get the Endpoints
	let inEndPoint = flow.getEndpoint('inFile');
	let outEndPoint = flow.getEndpoint('outFile');


	// This generator emulates the IN endpoint of the next step.
	// It will be connected with the OUT endpoint of the Adpater
	let generatorFunction = function* () {
		while (true) {
			const message = yield;


			// the received message should equal the sended one
			// before comparing delete the hops
			message.hops = [];

			assert.deepEqual(message, sourceMessage);
		}
	};

	outEndPoint.connectedEndpoint = generatorFunction;
	outEndPoint.outActiveIterator = generatorFunction();
	outEndPoint
		.outActiveIterator
		.next();


	let it = inEndPoint.getInPassiveIterator()();
	it.next();

	it.next(sourceMessage);

}
