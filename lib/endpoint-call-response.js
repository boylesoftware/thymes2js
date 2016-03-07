"use strict";

const stream = require('stream');
const util = require('./util.js');

/**
 * Application API call response. This object is normally returned by an endpoint
 * handler and used by the framework to construct the HTTP response to send back
 * to the client.
 */
class EndpointCallResponse {

	/**
	 * Create new empty response object with the specified HTTP response status
	 * code.
	 *
	 * @param {Application} app The application.
	 * @param {number} statusCode HTTP response status code.
	 */
	constructor(app, statusCode) {

		this._app = app;

		this._statusCode = statusCode;
		this._headers = new Map();
	}


	/**
	 * Associate value with the specified header, adding the header to the
	 * response if necessary.
	 *
	 * @param {string} name HTTP response header name, case-insensitive.
	 * @param {*} value Value to associate. The value is processed and combined
	 * with any existing value by the registred header value handler. If the
	 * value is <code>null</code> or <code>undefined</code>, the header is
	 * removed from the set (the <code>keepExisting</code> argument is ignored).
	 * @param {boolean} [keepExisting=false] If the header is already present,
	 * do not do anything.
	 * @returns This object for chaining.
	 */
	header(name, value, keepExisting) {

		const nameLC = name.toLowerCase();

		if (value === undefined || value === null) {
			this._headers.delete(nameLC);
		} else {
			let header = this._headers.get(nameLC);
			if (!header)
				this._headers.set(
					nameLC, header = this._app.headerValueHandler(nameLC));
			else if (keepExisting)
				return this;
			header.value(value);
		}

		return this;
	}

	/**
	 * Add entity to the response. The entity is sent in the HTTP response
	 * payload.
	 *
	 * <p>Multiple entities can be added to the response, which will result in a
	 * multipart HTTP response (content type "multipart/mixed"). The parts are
	 * included in the response body in the same order as they were added.
	 *
	 * <p>The entity data can be provided in three forms: an object, a Node.js
	 * <code>Buffer</code> or a Node.js <code>Stream</code>. If an object is
	 * provided, it is serialized using a service registered under
	 * "marshaller:content-type" name, where "content-type" is the value given
	 * as the <code>contentType</code> argument (see {@link Marshaller}). When
	 * the <code>contentType</code> argument is omitted, it defaults to
	 * "application/json". If the data is provided as a <code>Stream</code>, the
	 * response is sent asynchronously using HTTP "chunked" transfer encoding.
	 *
	 * @param {(Object|external:Buffer|external:"stream.Readable")} data The
	 * entity data.
	 * @param {string} [contentType=application/json] Content type.
	 * @param {string} [filename] Optional filename associated with the entity.
	 * @returns This object for chaining.
	 */
	entity(data, contentType, filename) {

		if (!this._entities)
			this._entities = [];

		const headers = {
			'content-type': contentType || 'application/json'
		};
		if (filename)
			headers['content-disposition'] =
				(this._entities.length > 0 ? 'attachment' : 'inline')
			+ '; filename="' + filename + '"';

		this._entities.push({
			data: data,
			headers: headers
		});

		if (data instanceof stream.Readable)
			this._hasStreams = true;

		return this;
	}


	/**
	 * The HTTP response status code.
	 *
	 * @type {number}
	 * @readonly
	 */
	get statusCode() {

		return this._statusCode;
	}

	/**
	 * Tells if the response contains any entities that are streams and therefore
	 * the HTTP response needs to be sent asynchronously using "chunked" transfer
	 * encoding.
	 *
	 * @type {boolean}
	 * @readonly
	 */
	get hasStreams() {

		return this._hasStreams;
	}

	/**
	 * Tell if the response includes the specified header.
	 *
	 * @param {string} name HTTP response header name, case-insensitive.
	 * @returns {boolean} <code>true</code> if already includes the header.
	 */
	hasHeader(name) {

		return this._headers.has(name.toLowerCase());
	}

	/**
	 * The response HTTP headers.
	 *
	 * @type {Object.<string,string>}
	 * @readonly
	 */
	get headers() {

		const res = {};
		this._headers.forEach((valueHandler, name) => {
			res[util.headerCase(name)] = valueHandler.value();
		});

		return res;
	}

	/**
	 * The entities included in the response. May be <code>undefined</code>, a
	 * one element array, or a multiple elements array for a multipart repsonse.
	 *
	 * @type {HttpEntity[]}
	 * @readonly
	 */
	get entities() {

		return Array.from(this._entities);
	}
}

module.exports = EndpointCallResponse;
