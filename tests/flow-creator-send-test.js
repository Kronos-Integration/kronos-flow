import test from 'ava';
import { flowTest } from './util';

test('flow one step', async t => {
  const flow = await flowTest(t, 'flow-one-step.json');

  t.is(flow.name, 'flow-one-step');
});

test('flow chained steps', async t => {
  const flow = await flowTest(t, 'flow-chained-steps.json');

  t.is(flow.name, 'flow-two-steps');
});
