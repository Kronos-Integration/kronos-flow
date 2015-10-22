/* jslint node: true, esnext: true */
"use strict";

const Step = require('kronos-step');

/**
 * This is the flow implementation.
 * It holds all the steps.
 */
module.exports = {
	"name": "kronos-flow",
	"description": "General step collection",

	_initialize(manager, scopeReporter, name, def, endpoints, props) {
		const steps = new Map();

		for (const name in def.steps) {
			steps.set(stepImpl.createStep(manager, scopeReporter, def.steps[name], name));
		}

		for (const step of steps.values()) {
			sr.enterScope('step', step.name);

			for (const en in step.endpoints) {
				sr.enterScope('endpoint', en);

				const e = step.endpoints[en];
				//console.log(`**** ${JSON.stringify(e.target)}`);
				let res;
				if (util.isString(e.target))
					if (res = e.target.match(/^([^\/]+)\/(.*)/)) {
						const targetStep = steps.get(res[1]);

						if (targetStep) {
							const targetEndpoint = targetStep.endpoints[res[2]];
							if (targetEndpoint) {
								e.setTarget(targetEndpoint);
							} else {
								sr.error('Target endpoint not found', 'step', sid, res[2]);
							}
						} else {
							sr.error('Target step not found', 'step', sid, res[1]);
						}
						//console.log(`${step}: ${e.target}: ${res[1]} ${res[2]} ${targetStep} ${targetEndpoint}`);
					}
				sr.leaveScope('endpoint');
			}
			sr.leaveScope('step');
		}

		props.steps = {
			value: steps
		};
	},

	_start() {
		return Promise.all(MapForEachValue(this.steps, s => s.start()));
	},

	_stop() {
		return Promise.all(MapForEachValue(this.steps, s => s.stop()));
	},

	_remove() {
		return Promise.all(MapForEachValue(this.steps, s => s.remove()));
	},

	/**
	 * Deliver json representation
	 * @param {Objects} options
	 * @return json representation
	 */
	toJSONWithOptions(options) {
		const json = this.super.toJSONWithOptions(options);
		json.steps = {};

		for (const s of map.values()) {
			json.steps[s.name] = s.toJSONWithOptions(options);
		}

		return json;
	}
};

/**
 * Calls function on each map entry and delivers function reults as an iterable.
 * @param {Map} map
 * @param {Function} f
 * @return {Iterator} result of calling f on each map entry
 * @api private
 */
function MapForEachValue(map, f) {
	const r = [];

	for (const i of map.values()) {
		r.push(f(i));
	}
	return r;
}
