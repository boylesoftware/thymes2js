"use strict";

const HeadersSet = require('./headers-set.js');

/**
 * Application API call response. This object is normally returned by an endpoint
 * handler and used by the framework to contruct the HTTP response to send back
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


	/*entity(data, contentType, filename) {
	}
	attachment(data, contentType, filename) {
	}*/
	//...


	/**
	 * Corresponding HTTP response status code.
	 *
	 * @type {number}
	 * @readonly
	 */
	get statusCode() {

		return this._statusCode;
	}

	get hasStreams() {

		// TODO:
		return false;
	}
}

module.exports = Response;
