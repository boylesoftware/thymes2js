"use strict";

const EndpointCallResponse = require('./endpoint-call-response.js');

/**
 * Endpoint call context. A context instance is associated with every individual
 * application endpoint call and is used by all components throughout the call
 * processing. The context provides the framework's API to the endpoint handlers.
 */
class EndpointCallContext {

	/**
	 * Create new context. The constructor is used internally by the framework.
	 *
	 * @param {Application} app The application.
	 * @param {Runtime} runtime Application runtime.
	 * @param {?Object} actor Actor making the call, or <code>null</code> if
	 * unauthenticated.
	 */
	constructor(app, runtime, actor) {

		this._app = app;
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

	/**
	 * Create and return a new endpoint call response. This method can be used by
	 * the endpoint handlers to create elaborate responses.
	 *
	 * @param {number} statusCode HTTP response status code.
	 * @returns {EndpointCallResponse} New response object.
	 */
	response(statusCode) {

		return new EndpointCallResponse(this._app, statusCode);
	}
}

module.exports = EndpointCallContext;
