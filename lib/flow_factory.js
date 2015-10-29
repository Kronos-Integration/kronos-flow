/* jslint node: true, esnext: true */
"use strict";

function loadFlows(manager, scopeReporter, jsonFlowDefinition) {
	for (let flowName in jsonFlowDefinition) {
		const singleFlowDefinition = jsonFlowDefinition[flowName];

		singleFlowDefinition.type = "kronos-flow";
		singleFlowDefinition.name = flowName;

		const flow = manager.getStepInstance(singleFlowDefinition);

		manager.registerStepImplementation(flow);
		manager.registerFlow(flow);
	}
}
