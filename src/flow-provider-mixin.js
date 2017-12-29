import { defineRegistryProperties } from 'registry-mixin';
import { InterceptorProviderMixin } from 'kronos-service';
import { StepProviderMixin } from 'kronos-step';

/**
 * mixin to create a _Flow_ owner.
 * Also incorporates _Step_ and _Interceptor_ ownership
 * @param {class} superclass
 * @return {class} with flow ownership support
 */
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
            return flow.start();
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

    /**
     * Stops execution and frees all used flows.
     * It will stop each flow.
     * @return {Promise} that fullfills when the manager has stopped
     */
    async _stop() {
      await Promise.all(
        Object.keys(this.flows).map(name => this.flows[name].stop())
      );
      return super._stop();
    }
  };
}
