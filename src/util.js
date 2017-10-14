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
