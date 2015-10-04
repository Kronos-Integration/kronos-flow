/* jslint node: true, esnext: true */
"use strict";

/**
 * This endpoint is only a placeholder. Endpoints of a flow do not realy exists. They are only placeholders.
 * Not until the first step in the flow connects an endpoint of the flow, it will become a real endpoint.
 * In this case the endpoint of the step will replace the dummy endpoint of the flow.
 * If a proxy endpoint will be used from outside the flow an error will be thrown
 */
class Endpoint {

	/**
	 * @param name The name of this endpoint
	 * @param flow The flow this endpoint is attached to
	 */
	constructor(config, flowName) {

		if (!config) {
			throw 'Error: No configuration given';
		}

		// Set the name of this endpoint
		if (config.name) {
			this.name = config.name;
		} else {
			throw 'Error: An endpoint could not be created without a name';
		}

		// configure the behavior of this endpoint
		this.active = false;
		this.passive = false;
		this.out = false;
		this.in = false;

		if (config.active !== undefined) {
			this.active = config.active;
		}
		if (config.passive !== undefined) {
			this.passive = config.passive;
		}
		if (config.out !== undefined) {
			this.out = config.out;
		}
		if (config.in !== undefined) {
			this.in = config.in;
		}


		this.flowName = flowName;
	}

	/**
	 * For the proxy it will always return false.
	 * @return false
	 */
	isConnected() {
		return false;
	}

	/**
	 * Connects an other endpoint to this one. It will check that the other endpoints
	 * matches this one. If not an error will be thrown.
	 */
	connect(otherEndpoint) {
		throw `ERROR: This flow endpoint '${this.name}' of the flow '${this.flowName}' does not realy exists. It first mus be connected with a step in the flow.`;
	}

}

module.exports = Endpoint;
