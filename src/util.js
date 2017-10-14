/**
 * Load a flow json files and created the flows from it.
 * The flows will be registerd at the manager
 * @param manager {object} The kronos-service-manager
 * @param jsonFlowDefinition {object} The flow definition
 * @return promise
 */
export function loadFlows(manager, jsonFlowDefinition) {
  const promises = [];

  for (const flowName in jsonFlowDefinition) {
    const singleFlowDefinition = jsonFlowDefinition[flowName];

    singleFlowDefinition.type = Flow.name;
    singleFlowDefinition.name = flowName;

    const flow = manager.createStepInstanceFromConfig(
      singleFlowDefinition,
      manager
    );
    promises.push(manager.registerStep(flow));
    promises.push(manager.registerFlow(flow));
  }

  return Promise.all(promises);
}

export function stepsByType(steps) {
  // The inbound steps will be stopped first
  const normalSteps = [];
  const inboundSteps = [];

  // Sort the steps
  for (const subStep of steps.values()) {
    if (subStep.inbound) {
      inboundSteps.push(subStep);
    } else {
      normalSteps.push(subStep);
    }
  }

  return [normalSteps, inboundSteps];
}
