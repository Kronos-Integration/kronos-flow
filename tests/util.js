import { Step } from 'kronos-step';
import { ServiceProviderMixin, Service } from 'kronos-service';
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

export class FlowProvider extends FlowProviderMixin(
  ServiceProviderMixin(Service)
) {}

export class MyStep extends Step {
  static get name() {
    return 'slow-start';
  }

  constructor(config, owner) {
    super(config, owner);
    this.time = config.time || 0;
  }

  toJSONWithOptions(options = {}) {
    const json = super.toJSONWithOptions(options);

    json.time = this.time;

    return json;
  }

  _start() {
    return new Promise((fulfill, reject) =>
      setTimeout(() => fulfill(this), this.time)
    );
  }

  _stop() {
    return new Promise((fulfill, reject) =>
      setTimeout(() => fulfill(this), this.time)
    );
  }
}

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

  const flow = owner.createStep(flowDefintion, owner);

  return flow;
}

export async function flowProvider() {
  const fp = new FlowProvider();
  await fp.start();
  fp.registerStep(MyStep);

  return fp;
}
