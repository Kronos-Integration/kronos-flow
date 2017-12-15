import { FlowProviderMixin } from '../src/flow-provider-mixin';
import { registerWithManager } from '../src/flow';

const fs = require('fs'),
  { promisify } = require('util'),
  path = require('path'),
  step = require('kronos-step'),
  stepPassThrough = require('kronos-step-passthrough');

/**
 * This function takes the flow and sends a message through it. Important is that the
 * flow itself has two endpoints with the name 'inFile' and 'outFile'. These endpoints
 * will be used to send and receive the message.
 * @param flowFileName The filename of the flow json.
 * @param flowName The name of the flow in the file
 * @param done The done callback.
 * @return promise
 */

class FlowProvider extends FlowProviderMixin(
  class Base {
    emit() {}
  }
) {}

export async function flowTest(t, flowFileName) {
  const owner = new FlowProvider();

  await stepPassThrough.registerWithManager(owner);
  await registerWithManager(owner);

  const readFile = promisify(fs.readFile);

  const flowDefintion = JSON.parse(
    await readFile(
      path.join(__dirname, '..', 'tests', 'fixtures', flowFileName),
      'UTF8'
    )
  );

  const flow = owner.declareStep(flowDefintion, owner);

  return flow;
}
