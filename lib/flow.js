/* jslint node: true, esnext: true */
"use strict";

const BaseStep = require('kronos-step').Step;

/**
 * This is the flow implementation.
 * It holds all the steps.
 */
class Flow extends BaseStep {



	/**
	 * Adds a new step to the flow
	 * @param step The step to be added.
	 */
	addStep(step) {
		this.steps[step.name] = step;
		step.flow = this;
	}

	/**
	 * Starts this flow. First start all steps but the 'inboundSteps'.
	 * After all the steps are sterted, start the 'inboundSteps' also.
	 * The flow could only be started if the flow is in the status ''stopped''
	 * @return Promise
	 */
	start() {
		const self = this;

		// only start if the flow is stopped
		if (self.status.name !== STATUS.stopped.name) {
			return new Promise(function (fulfill, reject) {
				reject("The flow is not in status 'stopped', so it could not be started.");
			});
		}

		self.status = STATUS.starting;

		// stores all the promisses from the starting steps
		let startingSteps = [];

		let inboundSteps = {};
		for (let i = 0; i < self.inboundSteps.length; i++) {
			let step = self.inboundSteps[i];

			inboundSteps[step.name] = step;
		}

		// first start all the NOT inboundSteps
		for (let stepName in self.steps) {
			if (!inboundSteps[stepName]) {
				startingSteps.push(self.steps[stepName].start());
			}
		}

		return Promise.all(startingSteps).then(function (values) {
			// Now the normal steps where started.
			startingSteps = [];

			// now start the inbound steps
			for (let i = 0; i < self.inboundSteps.length; i++) {
				let step = self.inboundSteps[i];
				startingSteps.push(step.start());
			}

			return Promise.all(startingSteps).then(function (fulfill) {
				// if all the steps are started switch the status to running
				self.status = STATUS.running;
				return new Promise(function (fulfill, reject) {
					fulfill(self.status);
				});
			});
		});
	}

	/**
	 * Stop this flow. First stop all the inbound steps. After these steps are stopped,
	 * stop all the other steps.
	 * @return Promise
	 */
	stop() {
		const self = this;

		// only stop the flow if the flow is running
		if (self.status.name !== STATUS.running.name) {
			return new Promise(function (fulfill, reject) {
				reject("The flow is not in status 'running', so it could not be stopped.");
			});
		}

		// switch the status
		self.status = STATUS.stopping;


		// stores all the promisses from the stopping steps
		let stoppingSteps = [];

		let inboundSteps = {};


		// first stop the inbound steps
		for (let i = 0; i < self.inboundSteps.length; i++) {
			let step = self.inboundSteps[i];
			inboundSteps[step.name] = step;
			stoppingSteps.push(step.stop());
		}


		return Promise.all(stoppingSteps).then(function (values) {
			// Now the inbound steps where started.
			stoppingSteps = [];

			// now stop the other steps
			for (let stepName in self.steps) {
				if (!inboundSteps[stepName]) {
					stoppingSteps.push(self.steps[stepName].stop());
				}
			}

			return Promise.all(stoppingSteps).then(function (fulfill) {
				// if all the steps are started switch the status to running
				self.status = STATUS.stopped;
				return new Promise(function (fulfill, reject) {
					fulfill(self.status);
				});
			});
		});


	}

	/**
	 * Returns true if the flow is stopped
	 * @return true if flow is in stopped state
	 */
	isStopped() {
		return this.status.name === STATUS.stopped.name;
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
