import { defineRegistryProperties } from 'registry-mixin';
import { InterceptorProviderMixin } from 'kronos-service';
import { StepProviderMixin } from 'kronos-step';

export function FlowProviderMixin(superclass) {
  return class FlowProviderMixin extends StepProviderMixin(
    InterceptorProviderMixin(superclass)
  ) {
    constructor(...args) {
      super(...args);

      defineRegistryProperties(this, 'flow', {
        withEvents: true,
        hasBeenRegistered: async flow => {
          if (flow.autostart) {
            flow.start();
          }
        },

        /**
         * Deletes a flow from the stored flow definitions. If the flow
         * is currently running, it will be stopped first. After it
         * is stopped, it will be deleted.
         * @return {Promise} returns a promise that is fullfilled when the flow is removed
         *         or one that rejects if there is no flow for the given flowName
         */
        willBeUnregistered: async flow => {
          await flow.stop();
          return flow.remove();
        }
      });
    }
  };
}