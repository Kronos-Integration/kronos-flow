/* jslint node: true, esnext: true */


"use strict";

exports.registerWithManager = function (manager) {
  manager.registerStepImplementation(require('./lib/flow'));
};
