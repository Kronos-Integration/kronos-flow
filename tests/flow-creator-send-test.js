import test from 'ava';
import { Flow, registerWithManager } from '../src/flow';
import { FlowProviderMixin } from '../src/flow-provider-mixin';

const fs = require('fs'),
  { promisify } = require('util'),
  path = require('path'),
  step = require('kronos-step'),
  stepPassThrough = require('kronos-step-passthrough');

test.only('flow load', async t => {
  await flowTest(t, 'flow_one_step.json');
});

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

async function flowTest(t, flowFileName) {
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

  const step = owner.declareStep(flowDefintion, owner);

  t.is(step.name, 'flowOne');
}

/*
      let inEndPoint = myFlow.endpoints.inFile;
      let outEndPoint = myFlow.endpoints.outFile;

      // This endpoint is the IN endpoint of the next step.
      // It will be connected with the OUT endpoint of the Adpater
      let receiveEndpoint = new endpoint.ReceiveEndpoint('testEndpointIn');

      // This endpoint is the OUT endpoint of the previous step.
      // It will be connected with the OUT endpoint of the Adpater
      let sendEndpoint = new endpoint.SendEndpoint('testEndpointOut');

      // This generator emulates the IN endpoint of the next step.
      // It will be connected with the OUT endpoint of the Adpater
      let receiveFunction = message => {
        // the received message should equal the sended one
        // before comparing delete the hops
        message.hops = [];

        assert.deepEqual(message, msgToSend);
        return Promise.resolve('OK');
      };

      receiveEndpoint.receive = receiveFunction;
      outEndPoint.connected = receiveEndpoint;
      sendEndpoint.connected = inEndPoint;

      return myFlow.start().then(step => sendEndpoint.receive(msgToSend));
    });
  });
}
*/
