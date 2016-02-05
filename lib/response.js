"use strict";

/**
 * Application API call response.
 */
class Response {

	constructor(statusCode) {

		this._statusCode = statusCode;
	}


	headerType(name, valueType, valueNormalizer) {

		//...

		return this;
	}

	header(name, value, keepExisting) {

		//...

		return this;
	}

	/*entity(data, contentType, filename) {
	}
	attachment(data, contentType, filename) {
	}*/
	//...


	get statusCode() {

		return this._statusCode;
	}

	get headers() {

		// TODO:
		return {};
	}

	get hasStreams() {

		// TODO:
		return false;
	}
}

module.exports = Response;
