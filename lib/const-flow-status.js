/* jslint node: true, esnext: true */
"use strict";


/**
 * Defines all the available status for a flow and a step.
 */

// Defines the different available message types.
const STATUS = {
	'stopped': {
		name: 'stopped',
		description: "The step/flow is stopped. This status exists after the step/flow was created or after it was successfuly stopped."
	},
	'stopping': {
		name: 'stopping',
		description: "The step/flow should be stopped, but has not become stopped"
	},
	'starting': {
		name: 'starting',
		description: "The step/flow should is beeing started but not yet running"
	},
	'running': {
		name: 'running',
		description: "The step/flow is in the normal run state."
	}
};


module.exports = STATUS;
