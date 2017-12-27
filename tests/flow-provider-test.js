import { Service } from 'kronos-service';
import { FlowProviderMixin } from '../src/flow-provider-mixin';
import { Flow } from '../src/flow';
import test from 'ava';

class FlowProvider extends FlowProviderMixin(Service) {
  static get name() {
    return 'flow-provider';
  }

  get owner() {
    return this;
  }

  // TODO
  emit() {}
}

test('flow provider', async t => {
  const fp = new FlowProvider();

  await fp.start();

  t.is(fp.state, 'running');

  fp.registerFlow(Flow);
});
