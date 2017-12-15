import test from 'ava';
import { flowTest } from './util';

test('flow load', async t => {
  const flow = await flowTest(t, 'flow-one-step.json');

  t.is(flow.name, 'flow-one-step');
});

test('flow load', async t => {
  const flow = await flowTest(t, 'flow-two-steps.json');

  t.is(flow.name, 'flow-two-steps');
});
