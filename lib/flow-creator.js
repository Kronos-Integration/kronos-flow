/* jslint node: true, esnext: true */
"use strict";

const cloneDeep = require('clone-deep');
const Endpoint = require('kronos-step').endpoint;
const FlowEndpoint = require('./flow-proxy-endpoint');

const flowFactory = require('./flow');


/**
 * The flow creator creates a flow out of a json flow definition.
 */

/**
 * Create a single flow from a flow definition.
 * First the flow endpoints will be created.
 * Then create all the steps and store the enpointConnection definition in an array
 * After all the steps where created, the steps need to be connected.
 *
 * @param kronos The kronos registry
 * @param flowName The name of this new flow
 * @param flowDefinition The json flow definition. This is a single definition for one flow
 *
 * @return flow The new created flow.
 */
function createFlowFromDefinition(kronos, flowName, flowDefinition) {

	// create a new flow object
	let newFlow = flowFactory(kronos, {
		"name": flowName
	});

	// The description for this flow
	newFlow.description = flowDefinition.description;

	// create the endpoints if existsing
	_createFlowEndpoints(flowDefinition, newFlow);

	// stores all the endpoint connections to be done after the steps where created.
	// {"stepName": stepName , "endpointName": endpoinName, "connection": endpointConnectionString}
	let endpointConnections = _createSteps(kronos, flowName, flowDefinition, newFlow);

	// Get the inbound steps
	_createInboundSteps(flowName, flowDefinition, newFlow);

	// Check that the flow has a minium of one inbound step
	if (newFlow.inboundSteps.length === 0) {
		throw "Error: The flow has no inbound steps defined";
	}

	// connect the steps with each other
	_createStepConnection(flowName, newFlow, endpointConnections);

	if (flowDefinition.endpoints) {
		// in this case the flow could also be used as a step and needs to be registered as step at kronos
		// TODO: Currently we may get problems with nested flows. A two pass creation is needed for that
		kronos.steps[flowName] = getFlowFactory(newFlow);
	}

	return newFlow;
}

/**
 * Creates a flow which behaves like a step. All flows which have endpoints could also be used as a step.
 * These flows needs to be registered at kronos as a step.
 * This function returns such a step factory for a flow.
 * @param newFlow The new created flow which should also be available as a step.
 * @return function (kronos, flow, opts) The step factory function
 */
function getFlowFactory(newFlow) {
	return function (kronos, flow, opts) {
		const newCreatedFlow = cloneDeep(newFlow);
		newCreatedFlow.flow = flow;
		newCreatedFlow.name = opts.name;
		return newCreatedFlow;
	};
}


/**
 * Connect the enpoints of the steps with each other
 * @param flowName The name of the flow to be created
 * @param newFlow The new flow beeing created from the given flowDefinition
 * @param endpointConnections An array of all the endpoint connections to be created
 */
function _createStepConnection(flowName, newFlow, endpointConnections) {
	for (let i = 0; i < endpointConnections.length; i++) {
		const connectionDefinition = endpointConnections[i];
		const sourceStepName = connectionDefinition.stepName;
		const sourceEndpointName = connectionDefinition.endpointName;
		const connection = connectionDefinition.connection;

		// the connection string has a format like this:
		// step:my_unzip/inUnZip
		// step:destStepName/destEndpointName or flow:endpoinName

		const sourceStep = newFlow.steps[sourceStepName];
		let sourceEndpoint = sourceStep.endpoints[sourceEndpointName];


		let targetEndpoint;
		if (connection.startsWith('step:')) {
			let connectionName = connection.replace('step:', '');
			let conParts = connectionName.split(/\//);
			const targetStepName = conParts[0];
			const targetEndpointName = conParts[1];

			const targetStep = newFlow.steps[targetStepName];
			if (!targetStep) {
				throw `The step '${sourceStepName}' in the flow '${flowName}' has an invalid enpoint connection type: '${connection}'. The target step '${targetStepName}' does not exists`;
			}
			targetEndpoint = targetStep.endpoints[targetEndpointName];
			if (!targetEndpoint) {
				throw `The step '${sourceStepName}' in the flow '${flowName}' has an invalid enpoint connection type: '${connection}'. The target endpoint does not exists`;
			}

			if (!sourceEndpoint) {
				throw `The step '${sourceStepName}' in the flow '${flowName}' has an invalid enpoint connection type: '${connection}'. The source endpoint '${sourceEndpointName}' does not exists`;
			}

			sourceEndpoint.connect(targetEndpoint);
		} else if (connection.startsWith('flow:')) {
			// This will not connect the step endpoint with the flo endpoint, it will replace the proxy endpoint of the flow
			// with the endpoint from the step

			let endpointName = connection.replace('flow:', '');
			let flowEndpoint = newFlow.endpoints[endpointName];
			if (!flowEndpoint) {
				throw `The step '${sourceStepName}' in the flow '${flowName}' has an invalid enpoint connection type: '${connection}'. The flow endpoint '${endpointName}' does not exists`;
			}


			let sourceEndpoint = sourceStep.endpoints[sourceEndpointName];
			if (!sourceEndpoint) {
				throw `The step '${sourceStepName}' in the flow '${flowName}' has an invalid enpoint connection type. '${connection}'. The source endpoint '${sourceEndpointName}' does not exists`;
			}

			// check if the endpoint definitions are matching
			if (flowEndpoint.active !== sourceEndpoint.active) {
				throw `The endpoint '${sourceEndpoint.name}' of the step '${sourceStepName}' in the flow '${flowName}' could not be connected with the flow endpoint '${flowEndpoint.name}'. The endpoint configuration does not match.`;
			}
			if (flowEndpoint.passive !== sourceEndpoint.passive) {
				throw `The endpoint '${sourceEndpoint.name}' of the step '${sourceStepName}' in the flow '${flowName}' could not be connected with the flow endpoint '${flowEndpoint.name}'. The endpoint configuration does not match.`;
			}
			if (flowEndpoint.in !== sourceEndpoint.in) {
				throw `The endpoint '${sourceEndpoint.name}' of the step '${sourceStepName}' in the flow '${flowName}' could not be connected with the flow endpoint '${flowEndpoint.name}'. The endpoint configuration does not match.`;
			}
			if (flowEndpoint.out !== sourceEndpoint.out) {
				throw `The endpoint '${sourceEndpoint.name}' of the step '${sourceStepName}' in the flow '${flowName}' could not be connected with the flow endpoint '${flowEndpoint.name}'. The endpoint configuration does not match.`;
			}

			newFlow.endpoints[endpointName] = sourceEndpoint;

		}
	}
}



/**
 * Get the inbound steps as defined in the flow definition and add them as inbound
 * steps if they exists
 * @param flowName The name of the flow to be created
 * @param flowDefinition The single flow definition
 * @param newFlow The new flow beeing created from the given flowDefinition
 */
function _createInboundSteps(flowName, flowDefinition, newFlow) {
	if (flowDefinition.inbound_steps === undefined || flowDefinition.inbound_steps.length === 0) {
		throw `In the flow '${flowName}' are no inbound step defined.`;
	}


	for (let i = 0; i < flowDefinition.inbound_steps.length; i++) {
		let stepName = flowDefinition.inbound_steps[i];
		// Check that the given steps exists
		if (newFlow.steps[stepName] === undefined) {
			throw `Error: The defined inbound step '${stepName}' does not exists in the flow.`;
		}

		// Add the step to the inbound steps
		newFlow.inboundSteps.push(newFlow.steps[stepName]);
	}
}



/**
 * Creates the step instannces defined in the flow definition
 * @param kronos The master kronos object
 * @param flowName The name of the flow to be created
 * @param flowDefinition The single flow definition
 * @param newFlow The new flow beeing created from the given flowDefinition
 * @return endpointConnections The endpoint connections of all the steps
 */
function _createSteps(kronos, flowName, flowDefinition, newFlow) {

	// Stores the endpoint connections of the steps. These will be connected
	// after all the steps are created.
	const endpointConnections = [];

	let steps = flowDefinition.steps;
	if (!steps) {
		throw `The flow '${flowName}' has no steps.`;
	}

	if (Object.getOwnPropertyNames(steps).length === 0) {
		throw `Error: The 'steps' are empty in the flow '${flowName}'.`;
	}


	for (const stepName in steps) {
		const stepDefinition = steps[stepName];

		// get / create the step configuration
		let config = stepDefinition.config;
		if (!config) {
			config = {};
		}
		config.name = stepName;


		const stepType = stepDefinition.type;
		if (!stepType) {
			throw `The step '${stepName}' in the flow '${flowName}' has no 'type' defined`;
		}

		// creates a new step instance for this flow
		const stepFactory = kronos.steps[stepType];
		if (!stepFactory) {
			throw `The step-type '${stepType}' in the step '${stepName}' in the flow '${flowName}' Could not be find. There is no step registered under this name.`;
		}
		const stepInstance = stepFactory(kronos, newFlow, config);
		newFlow.addStep(stepInstance);

		// iterate the endpoint connections of this step
		let endpoints = stepDefinition.endpoints;
		if (endpoints) {
			for (let endpointName in endpoints) {
				let endpointConnectionString = endpoints[endpointName];

				// store all the connection for later
				endpointConnections.push({
					"stepName": stepName,
					"endpointName": endpointName,
					"connection": endpointConnectionString
				});

			}
		}
	}

	return endpointConnections;
}

/**
 * Creates the flow own endpoints. These endpoints are proxy endpoints
 * @param flowDefinition The single flow definition
 * @param newFlow The new flow beeing created from the given flowDefinition
 */
function _createFlowEndpoints(flowDefinition, newFlow) {
	// First get the endpoints of this flow.
	let endpoints = flowDefinition.endpoints;

	// iterate over the endpoints and add them to the flow object
	if (endpoints) {
		for (const endpointName in endpoints) {
			const endpointConfig = endpoints[endpointName];
			endpointConfig.name = endpointName;

			// adds the endpoint to the flow
			newFlow.addEndpoint(new FlowEndpoint(endpointConfig, newFlow.name));
		}
	}
}


/**
 * Create flow objects from a flow definition
 * @param kronos The kronos registry
 * @param jsonFlowDefinition The flow definition json
 * @return flows An array with the new created flows
 */
module.exports = function (kronos, jsonFlowDefinition) {

	if (Object.getOwnPropertyNames(jsonFlowDefinition).length === 0) {
		throw "Error: empty flow definition.";
	}

	const createdFlows = [];
	// iterate over the flow definitions
	for (let flowName in jsonFlowDefinition) {
		const singleFlowDefinition = jsonFlowDefinition[flowName];
		const newFlow = createFlowFromDefinition(kronos, flowName, singleFlowDefinition);

		createdFlows.push(newFlow);
	}

	return createdFlows;
};
