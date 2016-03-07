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
	 * @param {?Object} requestEntity Parsed request entity, or <code>null</code>
	 * if none.
	 * @param {?Iterator.<HttpEntity>} requestAttachments Additional request
	 * entities for a multipart request, or <code>null</code> if none.
	 */
	constructor(app, runtime, actor, requestEntity, requestAttachments) {

		this._app = app;
		this._runtime = runtime;
		this._actor = actor;
		this._requestEntity = requestEntity;
		this._requestAttachments = requestAttachments;
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
	 * @type {?Object}
	 * @readonly
	 */
	get actor() {

		return this._actor;
	}

	/**
	 * Parsed and validated object included as the request entity, or
	 * <code>null</code> if the handler does not expect any request entity.
	 *
	 * <p>The request entity, when expected by the handler (see
	 * {@link EndpointHandler#getRequestEntityValidator}), is always loaded
	 * completely and parsed into an object by the framework. Then, after initial
	 * validation performed by the validator returned by the handler, it is made
	 * available to the handler via this context property. If the request payload
	 * is multipart, the first part is treated as the request entity. The rest of
	 * the parts are made available to the handler via the context's
	 * {@link EndpointCallContext#requestAttachments} property.
	 *
	 * @type {?Object}
	 * @readonly
	 */
	get requestEntity() {

		return this._requestEntity;
	}

	/**
	 * Iterator for additional entities in the multipart request, or
	 * <code>null</code> if none.
	 *
	 * @type {?Iterator.<HttpEntity>}
	 * @readonly
	 */
	get requestAttachments() {

		return this._requestAttachments;
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
