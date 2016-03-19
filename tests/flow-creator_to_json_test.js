/* global describe, it, xit, beforeEach */
/* jslint node: true, esnext: true */
"use strict";

const chai = require('chai'),
	assert = chai.assert,
	expect = chai.expect,
	should = chai.should(),
	fs = require('fs'),
	path = require('path'),
	testStep = require('kronos-test-step');

const step = require('kronos-step'),
	serviceManager = require('kronos-service-manager'),
	stepPassThrough = require('kronos-step-passthrough'),
	flow = require('../index.js');

const fixturesDir = path.join(__dirname, 'fixtures');


// ---------------------------
// Create a mock manager
// ---------------------------
const managerPromise = serviceManager.manager().then(manager =>
	Promise.all([
		flow.registerWithManager(manager),
		stepPassThrough.registerWithManager(manager)
	]).then(() =>
		Promise.resolve(manager)
	));


describe('flow-creator toJSON', () => {
	it('flowOneStep', () =>
		managerPromise.then(manager => {
			// load the json file
			const flowDefintionString = fs.readFileSync(path.join(fixturesDir, "flow_one_step.json"), "utf-8");
			const flowDefintionReference = JSON.parse(flowDefintionString);
			const flowDefintion = JSON.parse(flowDefintionString);

			// load the content of the flow definition
			flow.loadFlows(manager, flowDefintion).then(() => {
				// get the flow from the manager
				const myFlow = manager.flows.flowOne;

				assert.deepEqual(myFlow.toJSON(), flowDefintionReference.flowOne);
			});
		})
	);

	it('nestedComplex', () =>
		managerPromise.then(manager => {
			// load the json file
			const flowDefintionString = fs.readFileSync(path.join(fixturesDir, "flow_nested_complex.json"), "utf-8");
			const flowDefintionReference = JSON.parse(flowDefintionString);
			const flowDefintion = JSON.parse(flowDefintionString);

			// load the content of the flow definition
			flow.loadFlows(manager, flowDefintion).then(() => {
				// get the flow from the manager
				const myFlow = manager.flows.nestedComplex;
				assert.deepEqual(myFlow.toJSON(), flowDefintionReference.nestedComplex);
			});
		})
	);
});
