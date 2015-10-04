/*global describe, it*/
/* jslint node: true, esnext: true */
"use strict";

const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;
const should = chai.should();

const flowCreatorFactory = require('../lib/flow-creator');
const Endpoint = require('kronos-step').endpoint;

// flow without description
// flow without inbound step

describe('flow-creator', function () {

	it('flow: Create a flow with endpoints and connected steps', function (done) {

		flowCreatorFactory({
			"steps": {
				"FileInboundStep": mockStepFactory,
				"FileProcessStep": mockStepFactory
			}
		}, {
			"gumbo": {
				"steps": {
					"myStepName": {
						"type": "FileInboundStep",
						"endpoints": {
							"mockOut": "step:myStepName2/mockIn"
						}
					},
					"myStepName2": {
						"type": "FileProcessStep"
					}
				},
				"inbound_steps": ["myStepName"],
				"endpoints": {
					"flowIn": new Endpoint({
						"name": "flowIn",
						"in": true,
						"passive": true
					}),
					"flowOut": new Endpoint({
						"name": "flowOut",
						"out": true,
						"active": true
					})
				}
			}
		});

		done();
	});


	it('flow: Create a flow with endpoints', function (done) {

		flowCreatorFactory({
			"steps": {
				"FileInboundStep": mockStepFactory
			}
		}, {
			"gumbo": {
				"steps": {
					"myStepName": {
						"type": "FileInboundStep"
					}
				},
				"inbound_steps": ["myStepName"],
				"endpoints": {
					"flowIn": {
						"in": true,
						"passive": true
					},
					"flowOut": {
						"out": true,
						"active": true
					}
				}
			}
		});

		done();
	});

	it('flow: The defined inbound step does not exists', function (done) {
		// An empty flow has no steps
		expect(function () {
			flowCreatorFactory({
				"steps": {
					"FileInboundStep": mockStepFactory
				}
			}, {
				"gumbo": {
					"steps": {
						"myStepName": {
							"type": "FileInboundStep"
						}
					},
					"inbound_steps": ["myStepNameUndefined"]
				}
			});
		}).to.throw(
			"Error: The defined inbound step 'myStepNameUndefined' does not exists in the flow."
		);
		done();
	});


	it('flow: with inbound step', function (done) {

		flowCreatorFactory({
			"steps": {
				"FileInboundStep": mockStepFactory
			}
		}, {
			"gumbo": {
				"steps": {
					"myStepName": {
						"type": "FileInboundStep"
					}
				},
				"inbound_steps": ["myStepName"]
			}
		});

		done();
	});

	it('flow: Without any inbound step', function (done) {
		// An empty flow has no steps
		expect(function () {
			flowCreatorFactory({
				"steps": {
					"FileInboundStep": mockStepFactory
				}
			}, {
				"gumbo": {
					"steps": {
						"myStepName": {
							"type": "FileInboundStep"
						}
					}
				}
			});
		}).to.throw(
			"In the flow 'gumbo' are no inbound step defined."
		);
		done();
	});


	it('flow: Step type does not exists in Kronos', function (done) {
		// An empty flow has no steps
		expect(function () {
			flowCreatorFactory({
				"steps": {}
			}, {
				"gumbo": {
					"steps": {
						"myStepName": {
							"type": "FileInboundStep"
						}
					}
				}
			});
		}).to.throw(
			"The step-type 'FileInboundStep' in the step 'myStepName' in the flow 'gumbo' Could not be find. There is no step registered under this name."
		);
		done();
	});


	it('empty flows', function (done) {
		// an empty flow returns an empty erray
		expect(function () {
			flowCreatorFactory({}, {});
		}).to.throw("Error: empty flow definition.");
		done();
	});

	it('empty flow: no steps', function (done) {
		// An empty flow has no steps
		expect(function () {
			flowCreatorFactory({}, {
				"gumbo": {}
			});
		}).to.throw("The flow 'gumbo' has no steps.");
		done();
	});

	it('empty flow: empty steps', function (done) {
		// An empty flow has no steps
		expect(function () {
			flowCreatorFactory({}, {
				"gumbo": {
					"steps": {}
				}
			});
		}).to.throw("Error: The 'steps' are empty in the flow 'gumbo'.");
		done();
	});

});



function mockStepFactory(kronos, flow, opts) {
	return {
		"kronos": kronos,
		"flow": flow,
		"name": opts.name,
		"endpoints": {
			"mockIn": new Endpoint({
				"name": "mockIn",
				"in": true,
				"passive": true
			}),
			"mockOut": new Endpoint({
				"name": "mockOut",
				"out": true,
				"active": true
			})
		}
	};
}
