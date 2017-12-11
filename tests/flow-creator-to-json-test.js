import test from 'ava';

const fs = require('fs'),
  path = require('path'),
  step = require('kronos-step'),
  stepPassThrough = require('kronos-step-passthrough');

const fixturesDir = path.join(__dirname, 'fixtures');

test('test', t => {
  t.is(1, 1);
});

/*
describe('flow', () => {
  describe('toJSON', () => {
    it('flowOneStep', () =>
      managerPromise.then(manager => {
        const flowDefintionString = fs.readFileSync(
          path.join(fixturesDir, 'flow_one_step.json'),
          'utf-8'
        );
        const flowDefintionReference = JSON.parse(flowDefintionString);
        const flowDefintion = JSON.parse(flowDefintionString);

        flow.loadFlows(manager, flowDefintion).then(() => {
          const myFlow = manager.flows.flowOne;
          assert.deepEqual(myFlow.toJSON(), flowDefintionReference.flowOne);
        });
      }));

    it('nestedComplex', () =>
      managerPromise.then(manager => {
        const flowDefintionString = fs.readFileSync(
          path.join(fixturesDir, 'flow_nested_complex.json'),
          'utf-8'
        );
        const flowDefintionReference = JSON.parse(flowDefintionString);
        const flowDefintion = JSON.parse(flowDefintionString);

        flow.loadFlows(manager, flowDefintion).then(() => {
          const myFlow = manager.flows.nestedComplex;
          assert.deepEqual(
            myFlow.toJSON(),
            flowDefintionReference.nestedComplex
          );
        });
      }));
  });
});
*/
