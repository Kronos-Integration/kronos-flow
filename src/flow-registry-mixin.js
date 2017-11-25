import { defineRegistryProperties } from 'registry-mixin';

export function FlowRegistryMixin(superclass) {
  return class FlowRegistry extends superclass {
    constructor(...args) {
      super(...args);

      defineRegistryProperties(this, 'interceptor', {
        withCreateInstance: true,
        factoryType: 'new'
      });

      /**
       * createStepInstance(type,...args);
       * createStepInstanceFromConfig({ type: "type name" },...args);
       *   calls: registeredStep.createInstance( config, ...args)
       */
      defineRegistryProperties(this, 'step', {
        withCreateInstance: true,
        withEvents: true,
        factoryType: 'new'
        // todo pass 'registry' as 2nd. argument
      });

      defineRegistryProperties(this, 'flow', {
        withEvents: true,
        hasBeenRegistered: flow =>
          flow.autostart ? flow.start() : Promise.resolve(),

        /**
       * Deletes a flow from the stored flow definitions. If the flow
       * is currently running, it will be stopped first. After it
       * is stopped, it will be deleted.
       * @return {Promise} returns a promise that is fullfilled when the flow is removed
       *         or one that rejects if there is no flow for the given flowName
       */
        willBeUnregistered: flow => flow.stop().then(flow.remove())
      });
    }
  };
}
