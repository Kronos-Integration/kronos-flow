/* global describe, it, beforeEach */
/* jslint node: true, esnext: true */
"use strict";

const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;
const should = chai.should();

const events = require('events');

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
const sr = scopeReporter.createReporter(scopeDefinitions);
var stepImplementations = {};
const manager = Object.create(new events.EventEmitter(), {
	steps: {
		value: stepImplementations
	},
	scopeReporter: {
		value: sr
	}
});
manager.registerStepImplementation = function (si) {
	stepImplementations[si.name] = si;
};

manager.registerFlow = function (flow) {
	if (!this.flows) {
		this.flows = {};
	}
	this.flows[flow.name] = flow;
};

manager.getStepInstance = function (configuration) {
	const stepImpl = stepImplementations[configuration.type];
	if (stepImpl) {
		return stepImpl.createInstance(this, this.scopeReporter, configuration);
	}
};

// register the flow
flow.registerWithManager(manager);

// register the passthroughStep
stepPassThrough.registerWithManager(manager);

// create 5 copies and register them also
for (let i = 1; i < 6; i++) {
	const step = manager.getStepInstance({
		"type": "kronos-step-passthrough",
		"name": "Step_" + i
	});
	manager.registerStepImplementation(step);
}

let defaultMessage;

let flowDefintion = require(path.join(fixturesDir, "flow_nested_complex.json"));
flow.loadFlows(manager, sr, flowDefintion);

// describe('flow-creator: Extended functionality', function () {
//
// 	beforeEach(function () {
// 		defaultMessage = messageFactory({
// 			"my": "name"
// 		});
// 	});
//
//
// 	it('Flow with endpoints', function (done) {
// 		testObject(kronos, 'flow_with_endpoints.json', defaultMessage, done);
// 	});
//
// 	it('Flow used as step', function (done) {
//
// 		// Create the flow which will be used as a step in the next flow
// 		let flowDefintionStep = require(path.join(fixturesDir, 'flow_with_endpoints.json'));
// 		let flow = flowCreatorFactory(kronos, flowDefintionStep)[0];
//
// 		testObject(kronos, 'flow_using_flow_as_step.json', defaultMessage, done);
// 	});
//
// 	it('ERROR: Connect Step to Flow Endpoint. FlowOut does not exists', function (done) {
// 		let flowDefintion = require(path.join(fixturesDir, 'flow_not_matchin_endpoint_1.json'));
//
// 		expect(function () {
// 			flowCreatorFactory(kronos, flowDefintion);
// 		}).to.throw(
// 			"The step 'Gumbo_in' in the flow 'myExampleFlow' has an invalid enpoint connection type: 'flow:outNotThere'. The flow endpoint 'outNotThere' does not exists"
// 		);
// 		done();
// 	});
//
// 	it('ERROR: Connect Step to Flow Endpoint. FlowIn does not exists', function (done) {
// 		let flowDefintion = require(path.join(fixturesDir, 'flow_not_matchin_endpoint_2.json'));
//
// 		expect(function () {
// 			flowCreatorFactory(kronos, flowDefintion);
// 		}).to.throw(
// 			"The step 'Gumbo_in' in the flow 'myExampleFlow' has an invalid enpoint connection type: 'flow:inNotThere'. The flow endpoint 'inNotThere' does not exists"
// 		);
// 		done();
// 	});
//
//
// });
//
// describe('flow-creator: Base functionality', function () {
// 	it('flow: Create a flow with endpoints and connected steps', function (done) {
//
// 		flowCreatorFactory({
// 			"steps": {
// 				"FileInboundStep": mockStepFactory,
// 				"FileProcessStep": mockStepFactory
// 			}
// 		}, {
// 			"gumbo": {
// 				"steps": {
// 					"myStepName": {
// 						"type": "FileInboundStep",
// 						"endpoints": {
// 							"mockOut": "step:myStepName2/mockIn"
// 						}
// 					},
// 					"myStepName2": {
// 						"type": "FileProcessStep"
// 					}
// 				},
// 				"inbound_steps": ["myStepName"],
// 				"endpoints": {
// 					"flowIn": new Endpoint({
// 						"name": "flowIn",
// 						"in": true,
// 						"passive": true
// 					}),
// 					"flowOut": new Endpoint({
// 						"name": "flowOut",
// 						"out": true,
// 						"active": true
// 					})
// 				}
// 			}
// 		});
//
// 		done();
// 	});
//
//
// 	it('flow: Create a flow with endpoints', function (done) {
//
// 		flowCreatorFactory({
// 			"steps": {
// 				"FileInboundStep": mockStepFactory
// 			}
// 		}, {
// 			"gumbo": {
// 				"steps": {
// 					"myStepName": {
// 						"type": "FileInboundStep"
// 					}
// 				},
// 				"inbound_steps": ["myStepName"],
// 				"endpoints": {
// 					"flowIn": {
// 						"in": true,
// 						"passive": true
// 					},
// 					"flowOut": {
// 						"out": true,
// 						"active": true
// 					}
// 				}
// 			}
// 		});
//
// 		done();
// 	});
//
// 	it('flow: The defined inbound step does not exists', function (done) {
// 		// An empty flow has no steps
// 		expect(function () {
// 			flowCreatorFactory({
// 				"steps": {
// 					"FileInboundStep": mockStepFactory
// 				}
// 			}, {
// 				"gumbo": {
// 					"steps": {
// 						"myStepName": {
// 							"type": "FileInboundStep"
// 						}
// 					},
// 					"inbound_steps": ["myStepNameUndefined"]
// 				}
// 			});
// 		}).to.throw(
// 			"Error: The defined inbound step 'myStepNameUndefined' does not exists in the flow."
// 		);
// 		done();
// 	});
//
//
// 	it('flow: with inbound step', function (done) {
//
// 		flowCreatorFactory({
// 			"steps": {
// 				"FileInboundStep": mockStepFactory
// 			}
// 		}, {
// 			"gumbo": {
// 				"steps": {
// 					"myStepName": {
// 						"type": "FileInboundStep"
// 					}
// 				},
// 				"inbound_steps": ["myStepName"]
// 			}
// 		});
//
// 		done();
// 	});
//
// 	it('flow: Without any inbound step', function (done) {
// 		// An empty flow has no steps
// 		expect(function () {
// 			flowCreatorFactory({
// 				"steps": {
// 					"FileInboundStep": mockStepFactory
// 				}
// 			}, {
// 				"gumbo": {
// 					"steps": {
// 						"myStepName": {
// 							"type": "FileInboundStep"
// 						}
// 					}
// 				}
// 			});
// 		}).to.throw(
// 			"In the flow 'gumbo' are no inbound step defined."
// 		);
// 		done();
// 	});
//
//
// 	it('flow: Step type does not exists in Kronos', function (done) {
// 		// An empty flow has no steps
// 		expect(function () {
// 			flowCreatorFactory({
// 				"steps": {}
// 			}, {
// 				"gumbo": {
// 					"steps": {
// 						"myStepName": {
// 							"type": "FileInboundStep"
// 						}
// 					}
// 				}
// 			});
// 		}).to.throw(
// 			"The step-type 'FileInboundStep' in the step 'myStepName' in the flow 'gumbo' Could not be find. There is no step registered under this name."
// 		);
// 		done();
// 	});
//
//
// 	it('empty flows', function (done) {
// 		// an empty flow returns an empty erray
// 		expect(function () {
// 			flowCreatorFactory({}, {});
// 		}).to.throw("Error: empty flow definition.");
// 		done();
// 	});
//
// 	it('empty flow: no steps', function (done) {
// 		// An empty flow has no steps
// 		expect(function () {
// 			flowCreatorFactory({}, {
// 				"gumbo": {}
// 			});
// 		}).to.throw("The flow 'gumbo' has no steps.");
// 		done();
// 	});
//
// 	it('empty flow: empty steps', function (done) {
// 		// An empty flow has no steps
// 		expect(function () {
// 			flowCreatorFactory({}, {
// 				"gumbo": {
// 					"steps": {}
// 				}
// 			});
// 		}).to.throw("Error: The 'steps' are empty in the flow 'gumbo'.");
// 		done();
// 	});
//
// });

/**
 * This function creates a flow obect out of the given json definition.
 * Then it will send a message through the flow and checks that the message
 * will arrive at the out endpoint
 * @param kronos The kronos object which holds the step definitions
 * @param flowDefinitionJsonFile The filename of the json file to load. Relative to the fixtures directory.
 * @param sourceMessage The message to be send through the flow
 * @param done The 'done' callback
 */
function testObject(kronos, flowDefinitionJsonFile, sourceMessage, done) {
	let flowDefintion = require(path.join(fixturesDir, flowDefinitionJsonFile));


	// Create the flow objects and get the first one
	let flow = flowCreatorFactory(kronos, flowDefintion)[0];

	const step = manager.getStepInstance({
		"type": "kronos-flow",
		"name": "myFlow",
		"steps": flowDefintion
	});

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
			done();
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
