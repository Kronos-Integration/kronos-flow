/* global describe, it, xit, beforeEach */
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



describe('flow-creator toJSON', function () {
	xit('flowOneStep', function (done) {
		// load the json file
		const flowDefintionString = fs.readFileSync(path.join(fixturesDir, "flow_one_step.json"), "utf-8");
		const flowDefintionReference = JSON.parse(flowDefintionString);
		const flowDefintion = JSON.parse(flowDefintionString);

		// load the content of the flow definition
		flow.loadFlows(manager, manager.scopeReporter, flowDefintion);

		// get the flow from the manager
		const myFlow = manager.getFlow("flowOne");

		assert.deepEqual(myFlow.toJSON(), flowDefintionReference.flowOne);
		done();
	});


	xit('nestedComplex', function (done) {
		// load the json file
		const flowDefintionString = fs.readFileSync(path.join(fixturesDir, "flow_nested_complex.json"), "utf-8");
		const flowDefintionReference = JSON.parse(flowDefintionString);
		const flowDefintion = JSON.parse(flowDefintionString);

		// load the content of the flow definition
		flow.loadFlows(manager, manager.scopeReporter, flowDefintion);

		// get the flow from the manager
		const myFlow = manager.getFlow("nestedComplex");

		assert.deepEqual(myFlow.toJSON(), flowDefintionReference.nestedComplex);
		done();
	});
});
