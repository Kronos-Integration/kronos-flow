/* jslint node: true, esnext: true */
"use strict";

const Flow = require('./lib/flow');
const Step = require('kronos-step');

module.exports.Flow = Flow;


exports.registerWithManager = function (manager) {
  manager.registerStepImplementation(Step.prepareStepForRegistration(manager, undefined, Flow));
};
