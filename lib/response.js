"use strict";

const stream = require('stream');
const HeadersSet = require('./headers-set.js');

/**
 * Response entity descriptor.
 *
 * @typedef {Object} ResponseEntity
 * @property {(Object|external:Buffer|external:"stream.Readable")} data The
 * entity data.
 * @property {string} contentType Content type.
 * @property {string} [filename] Optional filename associated with the entity.
 */

/**
 * Application API call response. This object is normally returned by an endpoint
 * handler and used by the framework to construct the HTTP response to send back
 * to the client.
 *
 * @augments HeadersSet
 */
class Response extends HeadersSet {

	/**
	 * Create new empty response object with the specified HTTP response status
	 * code.
	 *
	 * @param {Application} app The application.
	 * @param {number} statusCode HTTP response status code.
	 */
	constructor(app, statusCode) {
		super(app);

		this._statusCode = statusCode;
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

		this._entities.push({
			data: data,
			contentType: contentType || 'application/json',
			filename: filename
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
	 * The entities included in the response. May be <code>undefined</code>, a
	 * one element array, or a multiple elements array for a multipart repsonse.
	 *
	 * @type {ResponseEntity[]}
	 * @readonly
	 */
	get entities() {

		return Array.from(this._entities);
	}
}

module.exports = Response;
