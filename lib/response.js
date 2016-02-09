"use strict";

const HeadersSet = require('./headers-set.js');

/**
 * Application API call response.
 *
 * @augments HeadersSet
 */
class Response extends HeadersSet {

	constructor(app, statusCode) {
		super(app);

		this._statusCode = statusCode;
	}


	/*entity(data, contentType, filename) {
	}
	attachment(data, contentType, filename) {
	}*/
	//...


	get statusCode() {

		return this._statusCode;
	}

	get hasStreams() {

		// TODO:
		return false;
	}
}

module.exports = Response;
