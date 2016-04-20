"use strict";

/**
 * Endpoint.
 *
 * @private
 */
class Endpoint {

	/**
	 * Create new endpoint.
	 *
	 * @param {string} uriPattern Endpoint URI regular expression pattern. URI
	 * parameters are groups in the pattern.
	 * @param {EndpointDefinition} def Endpoint definition object.
	 * @throws {SyntaxError} If specified URI pattern is invalid.
	 */
	constructor(uriPattern, def) {

		this._uriPattern = uriPattern;
		this._def = def;

		this._numUriParams =
			(new RegExp('^(?:' + uriPattern + ')?$')).exec('').length - 1;

		// TODO: create handler
		this._handler = {
			getAllowedMethods(resourceUri, uriParams) {
				return new Set([ 'GET', 'POST', 'PATCH', 'DELETE' ]);
			},
			isPublic(resourceUri, uriParams) {
				return false;
			},
			isAllowed(method, resourceUri, uriParams, actor) {
				return true;
			},
			getRequestEntityValidator(method, resourceUri, uriParams) {
				return function(obj, errors) {
					console.log('>>> validating entity: ' + obj);
					return obj;
				};
			},
			handleCall(ctx) {
				console.log('>>> handing call');
				return new Promise((resolve, reject) => {
					setTimeout(() => {
						resolve({
							a: "amber",
							z: "zumba"
						});
					}, 3000);
				});
			}
		};
	}


	/**
	 * Endpoint URI regular expression pattern.
	 *
	 * @type string
	 * @readonly
	 */
	get uriPattern() {

		return this._uriPattern;
	}

	/**
	 * Expected number of URI parameters.
	 *
	 * @type number
	 * @readonly
	 */
	get numUriParams() {

		return this._numUriParams;
	}

	/**
	 * Endpoint handler.
	 *
	 * @type EndpointHandler
	 * @readonly
	 */
	get handler() {

		return this._handler;
	}
}

module.exports = Endpoint;
