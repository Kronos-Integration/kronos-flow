import test from 'ava';

import { Flow } from '../src/flow';
import { Step } from 'kronos-step';

class MyStep extends Step {
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

const owner = {
  emit(name, arg1, arg2) {}, // dummy event emitter
  endpointIdentifier(e) {
    return `name:${e.name}`;
  },

  createStepInstanceFromConfig(config, owner) {
    //console.log(`instance: ${config}`);

    if (config.type === 'slow-start') {
      return new MyStep(config, owner);
    }

    return new Step(config, owner);
  }
};

function makeFlow(owner) {
  return new Flow(
    {
      name: 'myFlow1',
      description: 'my out-step description',

      steps: {
        step1: {
          type: 'slow-start',
          time: 10
        },
        step2: {
          type: 'mystep'
        }
      }
    },
    owner
  );
}

test('flow constructor', t => {
  const flow = makeFlow(owner);
  t.is(flow.name, 'myFlow1');
  t.is(flow.steps.get('step1').name, 'step1');
  t.is(flow.steps.get('step1').time, 10);
  t.is(flow.steps.get('step2').name, 'step2');
});

test('flow json', t => {
  const flow = makeFlow(owner);
  const json = flow.toJSONWithOptions();
  t.deepEqual(json, {
    //name: 'myFlow1',
    type: 'kronos-flow',
    //description: 'my out-step description',
    endpoints: {},

    steps: {
      step1: {
        type: 'slow-start',
        endpoints: {},
        time: 10
      },
      step2: {
        type: 'kronos-step',
        endpoints: {}
      }
    }
  });
});

/*
  describe('autostart', () => {
    it('is false', () =>
      Flow.loadFlows(manager, {
        myFlow: {
          type: 'kronos-flow',
          steps: {
            slowInbound: {
              type: 'slow-start',
              time: 10
            }
          }
        }
      }).then(() => {
        const f = manager.flows.myFlow;
        assert.equal(f.name, 'myFlow');
        assert.equal(f.autostart, false);
      }));

    it('is true', () =>
      Flow.loadFlows(manager, {
        myAutoStartFlow: {
          type: 'kronos-flow',
          autostart: true,
          steps: {
            slowInbound: {
              type: 'slow-start',
              time: 10
            }
          }
        }
      }).then(() => {
        const f = manager.flows.myAutoStartFlow;
        assert.equal(f.name, 'myAutoStartFlow');
        assert.equal(f.autostart, true);
      }));
  });

  describe('connections', () => {
    describe('service', () => {
      describe('optional', () => {
        it('create', done => {
          const s = manager.createStepInstanceFromConfig(
            {
              name: 'myFlowName',
              type: 'kronos-flow',
              steps: {
                'with-service': {
                  type: 'slow-start',
                  endpoints: {
                    optional: {
                      in: true,
                      target: 'aService:a1',
                      mandatory: false
                    }
                  }
                }
              }
            },
            manager
          );
          s.start().then(() => s.stop().then(() => done()));
        });
      });
      describe('mandatory', () => {
        describe('present', () => {
          it('create', done => {
            const s = manager.createStepInstanceFromConfig(
              {
                name: 'myFlowName',
                type: 'kronos-flow',
                steps: {
                  'with-service': {
                    type: 'slow-start',
                    endpoints: {
                      mandatory: {
                        out: true,
                        target: 'config:config'
                      }
                    }
                  }
                }
              },
              manager
            );
            s.start().then(() => s.stop().then(() => done()));
          });
        });

        describe('missing service', () => {
          it('create', done => {
            class TestService extends service.Service {
              static get name() {
                return 'testService';
              }
              get type() {
                return TestService.name;
              }
              constructor(config, owner) {
                super(config, owner);
                this.addEndpoint(
                  new endpoint.ReceiveEndpoint('a1', this)
                ).receive = entry => Promise.resolve();
              }
            }

            const s = manager.createStepInstanceFromConfig(
              {
                name: 'myFlowName',
                type: 'kronos-flow',
                steps: {
                  'with-service': {
                    type: 'slow-start',
                    endpoints: {
                      mandatory: {
                        out: true,
                        target: 'testService:a1',
                        mandatory: true
                      }
                    }
                  }
                }
              },
              manager
            );

            manager.registerServiceFactory(TestService);

            s.start().then(() => s.stop().then(() => done()));
          });
        });
        describe('missing service endpoint', () => {
          it('create', () => {
            try {
              manager.createStepInstanceFromConfig(
                {
                  name: 'myFlowName',
                  type: 'kronos-flow',
                  steps: {
                    'with-service': {
                      type: 'slow-start',
                      endpoints: {
                        mandatory: {
                          in: true,
                          target: 'config:a1'
                        }
                      }
                    }
                  }
                },
                manager
              );
            } catch (e) {
              assert.match(e, /service 'config' not found/);
            }
          });
        });
      });
    });

    describe('step', () => {
      describe('mandatory', () => {
        describe('missing step', () => {
          it('create', () => {
            try {
              manager.createStepInstanceFromConfig(
                {
                  name: 'myFlowName',
                  type: 'kronos-flow',
                  steps: {
                    s1: {
                      type: 'slow-start',
                      endpoints: {
                        mandatory: {
                          in: true,
                          target: 'aStep/a1',
                          mandatory: true
                        }
                      }
                    }
                  }
                },
                manager
              );
            } catch (e) {
              assert.match(e, /Step 'aStep' not found/);
            }
          });
        });
        describe('missing step endpoint', () => {
          it('create', () => {
            try {
              manager.createStepInstanceFromConfig(
                {
                  name: 'myFlowName',
                  type: 'kronos-flow',
                  steps: {
                    s1: {
                      type: 'slow-start',
                      endpoints: {
                        mandatory: {
                          in: true,
                          target: 's1/a1'
                        }
                      }
                    }
                  }
                },
                manager
              );
            } catch (e) {
              assert.match(e, /step 's1' not found/);
            }
          });
        });
      });
    });

    before(() =>
      Flow.loadFlows(manager, {
        myFlowName: {
          type: 'kronos-flow',
          steps: {
            normal: {
              type: 'slow-start',
              time: 5
            }
          }
        }
      })
    );

    it('basic', done => {
      const s = manager.flows.myFlowName;
      s.start().then(() =>
        s.stop().then(() => {
          done();
        })
      );
    });
  });
});
*/
