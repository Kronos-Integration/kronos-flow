/* global describe, it, xit, beforeEach */
/* jslint node: true, esnext: true */
"use strict";

const chai = require('chai'),
	assert = chai.assert,
	expect = chai.expect,
	should = chai.should(),
	scopeReporter = require('scope-reporter'),
	events = require('events'),
	stepPassThrough = require('kronos-step-passthrough'),
	testStep = require('kronos-test-step'),
	flow = require('../lib/flow'),
	step = require('kronos-step');



describe('flow instance', function () {
	xit('instance', function (done) {
		// to be done
		// build a flow which uses other flows as steps which where registered
		// at the manager. Then the flows createInstance function will be called which
		// will currnetly not work in the correct way I think.
	});

});
