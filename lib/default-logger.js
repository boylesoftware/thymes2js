"use strict";

const util = require('util');

/**
 * Default logger implementation.
 *
 * @private
 */
class DefaultLogger {

	constructor() {

		this._debuglog = util.debuglog('x2');
		this._debugEnabled = /\bx2\b/i.test(process.env['NODE_DEBUG']);
	}


	debug(msg, params) {

		this._debuglog(...arguments);
	}

	info(msg, vals) {

		console.info(...arguments);
	}

	warning(msg, vals) {

		console.warn(...arguments);
	}

	error(msg, vals) {

		console.error(...arguments);
	}

	isDebugEnabled() {

		return this._debugEnabled;
	}
}

module.exports = DefaultLogger;
