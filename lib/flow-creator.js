/* jslint node: true, esnext: true */
"use strict";

const Endpoint = require('kronos-step').endpoint;

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

	// stores all the endpoint connections to be done after the steps where created.
	// {"stepName": stepName , "endpointName": endpoinName, "connection": endpointConnectionString}
	let endpointConnections = [];


	// ---------------------------------------------------
	// create the endpoints
	// ---------------------------------------------------

	// First get the endpoints of this flow.
	let endpoints = flowDefinition.endpoints;

	// iterate over the endpoints and add them to the flow object
	if (endpoints) {
		for (const endpointName in endpoints) {
			const endpointConfig = endpoints[endpointName];
			endpointConfig.name = endpointName;

			// adds the endpoint to the flow
			newFlow.addEndpoint(new Endpoint(endpointConfig));
		}

		// If a flow has endpoints it is like a step and needs to be registered as as step

	}

	// ---------------------------------------------------
	// create the steps
	// ---------------------------------------------------
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
	// ---------------------------------------------------
	// Get the inbound steps
	// ---------------------------------------------------
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


	// ---------------------------------------------------
	// Check that the flow has a minium of one inbound step
	// ---------------------------------------------------
	if (newFlow.inboundSteps.length === 0) {
		throw "Error: The flow has no inbound steps defined";
	}


	// ---------------------------------------------------
	// connect the steps with each other
	// ---------------------------------------------------
	for (let i = 0; i < endpointConnections.length; i++) {
		const connectionDefinition = endpointConnections[i];
		const sourceStepName = connectionDefinition.stepName;
		const sourceEndpointName = connectionDefinition.endpointName;
		const connection = connectionDefinition.connection;

		// the connection string has a format like this:
		// step:my_unzip/inUnZip
		// step:destStepName/destEndpointName or flow:endpoinName

		let targetEndpoint;
		if (connection.startsWith('step:')) {
			let connectionName = connection.replace('step:', '');
			let conParts = connectionName.split(/\//);
			const targetStepName = conParts[0];
			const targetEndpointName = conParts[1];

			const targetStep = newFlow.steps[targetStepName];
			if (!targetStep) {
				throw `The step '${sourceStepName}' in the flow '${flowName}' has an invalid enpoint connection type. '${connection}'. The target step '${targetStepName}' does not exists`;
			}
			targetEndpoint = targetStep.endpoints[targetEndpointName];
		} else if (connection.startsWith('flow:')) {
			let endpointName = connection.replace('flow:', '');
			targetEndpoint = newFlow.endpoints[endpointName];
		}

		if (!targetEndpoint) {
			throw `The step '${sourceStepName}' in the flow '${flowName}' has an invalid enpoint connection type. '${connection}'. The target endpoint does not exists`;
		}

		const sourceStep = newFlow.steps[sourceStepName];
		let sourceEndpoint = sourceStep.endpoints[sourceEndpointName];

		if (!sourceEndpoint) {
			throw `The step '${sourceStepName}' in the flow '${flowName}' has an invalid enpoint connection type. '${connection}'. The source endpoint '${sourceEndpointName}' does not exists`;
		}

		sourceEndpoint.connect(targetEndpoint);
	}

	return newFlow;
}

/**
 * Creates the flow own endpoints.
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
			newFlow.addEndpoint(new Endpoint(endpointConfig));
		}

		// If a flow has endpoints it is like a step and needs to be registered as as step

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
