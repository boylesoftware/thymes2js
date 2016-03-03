"use strict";

/**
 * Endpoint call context. A context instance is associated with every individual
 * application endpoint call and is used by all components throughout the call
 * processing. The context provides the framework's API to the endpoint handlers.
 */
class EndpointCallContext {

	/**
	 * Create new context. The constructor is used internally by the framework.
	 *
	 * @param {Runtime} runtime Application runtime.
	 * @param {?Object} actor Actor making the call, or <code>null</code> if
	 * unauthenticated.
	 */
	constructor(runtime, actor) {

		this._runtime = runtime;
		this._actor = actor;
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

	/**
	 * Actor associated with the call, or <code>null</code> if unauthenticated.
	 *
	 * @type {Object}
	 * @readonly
	 */
	get actor() {

		return this._actor;
	}
}

module.exports = EndpointCallContext;
