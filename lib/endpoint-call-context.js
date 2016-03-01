"use strict";

/**
 * Endpoint call context. A context instance is associated with every individual
 * application endpoint call and is used by all components throughout the call
 * processing. The context provides the framework's API to the endpoint handlers.
 */
class EndpointCallContext {

	constructor(runtime) {

		this._runtime = runtime;
	}


	/**
	 * Application runtime.
	 *
	 * @type {Runtime}
	 * @readonly
	 */
	get runtime() {

		return this._runtime;
	}
}

module.exports = EndpointCallContext;
