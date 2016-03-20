/* global describe, it, xit, before, beforeEach, after, afterEach */
/* jslint node: true, esnext: true */
"use strict";

const chai = require('chai'),
	assert = chai.assert,
	expect = chai.expect,
	should = chai.should(),
	fs = require('fs'),
	path = require('path'),
	testStep = require('kronos-test-step'),
	step = require('kronos-step'),
	ksm = require('kronos-service-manager'),
	stepPassThrough = require('kronos-step-passthrough'),
	flow = require('../index.js');

const fixturesDir = path.join(__dirname, 'fixtures');


// ---------------------------
// Create a mock manager
// ---------------------------
const managerPromise = ksm.manager().then(manager =>
	Promise.all([
		flow.registerWithManager(manager),
		stepPassThrough.registerWithManager(manager)
	]).then(() =>
		Promise.resolve(manager)
	));

describe('flow', () => {
	describe('toJSON', () => {
		it('flowOneStep', () =>
			managerPromise.then(manager => {
				const flowDefintionString = fs.readFileSync(path.join(fixturesDir, "flow_one_step.json"), "utf-8");
				const flowDefintionReference = JSON.parse(flowDefintionString);
				const flowDefintion = JSON.parse(flowDefintionString);

				flow.loadFlows(manager, flowDefintion).then(() => {
					const myFlow = manager.flows.flowOne;
					assert.deepEqual(myFlow.toJSON(), flowDefintionReference.flowOne);
				});
			})
		);

		it('nestedComplex', () =>
			managerPromise.then(manager => {
				const flowDefintionString = fs.readFileSync(path.join(fixturesDir, "flow_nested_complex.json"), "utf-8");
				const flowDefintionReference = JSON.parse(flowDefintionString);
				const flowDefintion = JSON.parse(flowDefintionString);

				flow.loadFlows(manager, flowDefintion).then(() => {
					const myFlow = manager.flows.nestedComplex;
					assert.deepEqual(myFlow.toJSON(), flowDefintionReference.nestedComplex);
				});
			})
		);
	});
});
