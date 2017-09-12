import test from 'ava';

import { Flow } from '../src/flow';

const owner = {
  emit(name, arg1, arg2) {}, // dummy event emitter
  endpointIdentifier(e) {
    return `name:${e.name}`;
  }
};

test('null constructor', t => {
  const step = new Flow(
    {
      name: 'myStep2',
      description: 'my out-step description'
    },
    owner
  );
});

/*
const ksm = require('kronos-service-manager'),
  testStep = require('kronos-test-step'),
  Flow = require('../lib/flow'),
  step = require('kronos-step'),
  service = require('kronos-service'),
  endpoint = require('kronos-endpoint');

describe('flow', () => {
  let manager;

  before('prepare manager', done => {
    ksm.manager({}, [require('../index')]).then(m => {
      manager = m;

      manager
        .registerStep(
          Object.assign({}, step.Step, {
            name: 'slow-start',

            initialize(manager, name, stepConfiguration, props) {
              props.time = {
                value: stepConfiguration.time
              };
            },

            _start() {
              return new Promise((fulfill, reject) =>
                setTimeout(() => fulfill(this), this.time)
              );
            },

            _stop() {
              return new Promise((fulfill, reject) =>
                setTimeout(() => fulfill(this), this.time)
              );
            }
          })
        )
        .then(() => done());
    });
  });

  describe('toJSON', () => {
    it('toJSONWithOptions', () =>
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
      }).then(() =>
        assert.deepEqual(manager.flows.myFlow.toJSONWithOptions(), {
          description: 'General step collection',
          endpoints: {},
          steps: {
            slowInbound: {
              description:
                'This step is the base class for step implementations',
              endpoints: {},
              type: 'slow-start'
            }
          },
          type: 'kronos-flow'
        })
      ));
  });

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
