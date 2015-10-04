/* jslint node: true, esnext: true */
"use strict";



/**
 * This is the flow implementation.
 * It holds all the steps.
 */
class Flow {
	/**
	 * @param kronos The framework manager
	 * @param flow The flow this step was added to
	 * @param config The configration for this step
	 */
	constructor(kronos, config) {
		if (!kronos) {
			throw 'No KRONOS given';
		}

		if (!config) {
			throw 'No config given.';
		}

		if (!config.name) {
			throw 'No step name given.';
		}

		// The endpoins of this flow
		this.endpoints = {};

		// The name of the Step
		this.name = config.name;

		this.kronos = kronos;

		// Stores the steps by there name.
		this.steps = {};

		// Stores all the inbound steps. This is necessary to stop a flow.
		this.inboundSteps = [];
	}

	/**
	 * Adds a new endpoint to this flow. If there was an enpoint with the same name
	 * before added, it will be overwritten.
	 * A flow could only have endpoints with unique names.
	 * @param endpoint The endpoint to be added.
	 */
	addEndpoint(endpoint) {
		this.endpoints[endpoint.name] = endpoint;
		endpoint.step = this;
	}

	/**
	 * Adds a new step to the flow
	 * @param step The step to be added.
	 */
	addStep(step) {
		this.steps[step.name] = step;
		step.flow = this;
	}

	/**
	 * Starts this flow
	 */
	start() {

	}

	/**
	 * Stop this floe
	 */
	stop() {

	}

	/**
	 * Returns the endpoint with the given name
	 */
	getEndpoint(name) {
		return this.endpoints[name];
	}

	/**
	 * Pushes messages to outgoing endpoints
	 */
	_push(endpointName, message) {
		if (this.endpoints[endpointName]) {
			// the endpoint exists. To push something to an endpoint it must be out active
			this.endpoints[endpointName].push(message);
		}
	}

	/**
	 * receives messages from incomming endpoints.
	 * @param endpointName The name of the enpoint which receives this message
	 * @param message The message
	 */
	_receive(endpointName, message) {
		try {
			this._doReceive(endpointName, message);
		} catch (err) {
			//this._logMessage(LOG_LEVEL.error, message, err, endpointName);
		}
	}

}

module.exports = function (kronos, config) {
	return new Flow(kronos, config);
};
