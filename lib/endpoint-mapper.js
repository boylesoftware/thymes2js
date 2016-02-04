"use strict";

/**
 * Endpoint lookup result.
 *
 * @private
 * @typedef {Object} EndpointLookupResult
 * @property {EndpointHandler} handler Endpoint handler.
 * @property {string} uri Endpoint URI, which is the path section of the request
 * URL sans the endpoint prefix, if any.
 * @property {string[]} uriParams Extracted URI parameters. If optional parameter
 * is not present in the URI, <code>undefined</code> is returned in its place.
 */

/**
 * Endpoint mapper.
 *
 * @private
 */
class EndpointMapper {

	/**
	 * Create new mapper.
	 *
	 * @param {Endpoint[]} endpoints The endpoints.
	 * @param {ConfigFunction} configFn Application configuration access
	 * function.
	 */
	constructor(endpoints, configFn) {

		this._endpointsIndex = new Array();

		let pattern = "^";
		this._endpointsPrefix = configFn("X2_ENDPOINTS_PREFIX");
		if (this._endpointsPrefix)
			pattern += this._endpointsPrefix;

		pattern += "(?:";
		let patternIndex = 0;
		endpoints.forEach(endpoint => {
			if (patternIndex > 0)
				pattern += "|";
			pattern += "(" + endpoint.uriPattern + ")";
			this._endpointsIndex[patternIndex] = endpoint;
			patternIndex += endpoint.numUriParams + 1;
		});
		pattern += ")$";

		this._masterEndpointsURIPattern = new RegExp(pattern);
	}


	/**
	 * Lookup endpoint matching the specified request URL.
	 *
	 * @param {string} requestUri Request URI, which is the path section of the
	 * request URL that comes after the host and before the query, including the
	 * leading slash.
	 * @returns {EndpointLookupResult} Lookup result, or <code>null</code> if
	 * nothing matched.
	 */
	lookup(requestUri) {

		// match the endpoint
		let match = this._masterEndpointsURIPattern.exec(requestUri);
		if (!match)
			return null;

		// find matched endpoint in the index
		let endpointInd = this._endpointsIndex.findIndex(
			(endpoint, i) => match[i + 1]);
		let endpoint = this._endpointsIndex[endpointInd];
		let uriParams = match.slice(
			endpointInd + 2, endpointInd + 2 + endpoint.numUriParams);

		// return the lookup result
		return {
			handler: endpoint.handler,
			uri: (
				this._endpointsPrefix ?
					requestUri.substring(this._endpointsPrefix.length) :
					requestUri
			),
			uriParams: uriParams
		};
	}
}

module.exports = EndpointMapper;
