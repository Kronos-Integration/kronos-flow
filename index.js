/* jslint node: true, esnext: true */
'use strict';

const Flow = require('./lib/flow');

module.exports.FlowFactory = Flow.FlowFactory;
module.exports.loadFlows = Flow.loadFlows;
module.exports.registerWithManager = manager => manager.registerStep(Flow.FlowFactory);
