/* jslint node: true, esnext: true */
"use strict";

const chokidar = require('chokidar');

const fs = require('fs');
const path = require("path");

const baseStep = require('kronos-step').step;

/**
 * Opens a read stream from a file from the file system
 */
class FlowAsStep extends baseStep {
	/**
	 * @param kronos The framework manager
	 * @param flow The flow this step was added to
	 * @param config The configration for this step
	 */
	constructor(kronos, flow, config) {
		super(kronos, flow, config);


	}
}
