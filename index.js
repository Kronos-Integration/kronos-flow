/* jslint node: true, esnext: true */
"use strict";

const Flow = require('./lib/flow');
const Step = require('kronos-step');

module.exports.Flow = Flow;
module.exports.loadFlows = Flow.loadFlows;


exports.registerWithManager = function (manager) {
  manager.registerStepImplementation(Step.prepareStepForRegistration(manager, undefined, Flow));
};
