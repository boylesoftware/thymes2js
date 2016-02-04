"use strict";

const util = require('util');
const url = require('url');
const Endpoint = require('./endpoint.js');
const EndpointMapper = require('./endpoint-mapper.js');
const NoAuthenticator = require('./authenticator/no-authenticator.js');

/**
 * The application, which is a central piece of the framework representing the
 * server-side application that exposes a RESTful API.
 *
 * <p>The application is customized by registering three types of components:
 *
 * <dl>
 * <dt>Resources<dd>Resources are used to describe the application's data domain.
 * They define different types of records stored in the persistent storage, with
 * which the application operates.
 * <dt>Endpoints<dd>Endpoints are components associated with certain HTTP request
 * URI patterns and responsible for the application API logic.
 * <dt>Services<dd>Services are singleton components that provide logic to the
 * application endpoint handlers as well as other framework components.
 * </dl>
 */
class Application {

	/**
	 * Create new application. The constructor is not used directly by the
	 * application. Normally, it's created using
	 * {@link module:thymes2js.createApplication} function.
	 *
	 * @param {ConfigFunction} configFn Application configuration access
	 * function.
	 * @param {Logger} logger The logger.
	 */
	constructor(configFn, logger) {

		this._configFn = configFn;
		this._logger = logger;

		this._endpoints = new Array();
		this._endpointMapper = null;

		this._services = new Map();
		this._services.set('authenticator', new NoAuthenticator());

		const allowedOriginsPattern = configFn('X2_ALLOWED_ORIGINS');
		if (allowedOriginsPattern)
			this._allowedOriginsPattern = new RegExp(
				'^' + allowedOriginsPattern + '$', 'i');
	}


	/**
	 * Add API endpoint to the application.
	 *
	 * @param {string} uriPattern Endpoint URI regular expression pattern. URI
	 * parameters are groups in the pattern.
	 * @param {EndpointDefinition} def Endpoint definition object.
	 * @returns {Application} This application for chaining.
	 * @throws {SyntaxError} The specified URI pattern is invalid.
	 */
	endpoint(uriPattern, def) {

		// create and save the endpoint object
		this._endpoints.push(new Endpoint(uriPattern, def));

		// reset the endpoint mapper
		this._endpointMapper = null;

		// done
		return this;
	}

	/**
	 * Add resource to the application.
	 *
	 * @param {ResourceDefinition} def Resource definition.
	 * @returns {Application} This application for chaining.
	 */
	resource(def) {

		// TODO:...

		return this;
	}

	/**
	 * Add multiple resources to the application at once.
	 *
	 * @param {ResourceDefinition[]} defs Resource definitions.
	 * @returns {Application} This application for chaining.
	 */
	resources(defs) {

		defs.forEach(def => { this.resource(def); });

		return this;
	}

	/**
	 * Add service to the application.
	 *
	 * @param {string} name Service name.
	 * @param {*} service Service instance.
	 * @returns {Application} This application for chaining.
	 */
	service(name, service) {

		this._services.set(name, service);

		return this;
	}

	/**
	 * Respond to a request.
	 *
	 * @param {external:"http.IncomingMessage"} httpRequest The request.
	 * @param {external:"http.ServerResponse"} httpResponse The response.
	 */
	respond(httpRequest, httpResponse) {

		// create endpoint mapper if necessary
		if (this._endpointMapper === null)
			this._endpointMapper = new EndpointMapper(
				this._endpoints, this._configFn);

		// parse request URL
		const requestUrl = url.parse(httpRequest.url, true);

		// lookup the endpoint
		const match = this._endpointMapper.lookup(requestUrl.pathname);
		if (!match)
			return this._sendErrorResponse(
				httpResponse, 404, 'X2-404-1', 'No API endpoint at this URI.');

		// get an endpoint call
		if (this._logger.isDebugEnabled())
			this._logger.debug(
				'received endpoint request %s %s', httpRequest.method,
				httpRequest.url);

		// get allowed methods from the handler
		const allowedMethods =
			match.handler.getAllowedMethods(match.uri, match.uriParams);

		// respond to an OPTIONS request
		if (httpRequest.method === 'OPTIONS')
			return this._sendOptionsResponse(
				httpResponse, httpRequest.headers, allowedMethods);

		// check if HEAD request
		const headRequest = (httpRequest.method === 'HEAD');

		// verify that the method is allowed
		if (!allowedMethods.has(headRequest ? 'GET' : httpRequest.method))
			return this._sendErrorResponse(
				httpResponse, 405, 'X2-405-1',
				'Method not supported by the API.');

		// authenticate the request
		this._services.get('authenticator').authenticate(httpRequest).then(
			(actor) => {

				// check if actor is allowed to make the call
				if (!match.handler.isAllowed(
					httpRequest.method, match.uri, match.uriParams, actor)) {
					if (actor !== null)
						return this._sendErrorResponse(
							httpResponse, 403, 'X2-403-1',
							'Insufficient permissions.');
					return this._sendErrorResponse(
						httpResponse, 401, 'X2-401-1',
						'Authentication required.');
				}

				// TODO: create context, call handler, send response
				//...

				setTimeout(() => {
					const body =
						  'call to [' + requestUrl.pathname + ']\r\n'
						  + 'endpoint handler: ' + match.handler + '\r\n'
						  + 'URI: ' + match.uri + '\r\n'
						  + 'URI params: ' + match.uriParams + '\r\n'
						  + 'actor: ' + actor + '\r\n';
					httpResponse.writeHead(200, {
						'Content-Type': 'text/plain',
						'Content-Length': body.length
					});
					httpResponse.end(body);
				}, 100);
			}
		);
	}

	/**
	 * Gracefully shutdown the application.
	 */
	shutdown() {

		this._logger.info("shutting down the application");

		// TODO: implement
	}

	/**
	 * Send HTTP error response.
	 *
	 * @private
	 * @param {external:"http.ServerResponse"} response The response.
	 * @param {number} httpResponseCode HTTP response code.
	 * @param {string} errorCode Application error code.
	 * @param {string} [errorMessage] Error message.
	 * @param {Object} [errorDetails] Error details object.
	 */
	_sendErrorResponse(
		response, httpResponseCode, errorCode, errorMessage, errorDetails) {

		const entityObj = {
			errorCode: errorCode
		};
		if (errorMessage)
			entityObj.errorMessage = errorMessage;
		if (util.isObject(errorDetails))
			entityObj.errorDetails = errorDetails;
		const entity = JSON.stringify(entityObj);

		response.writeHead(httpResponseCode, {
			'Content-Type': 'application/json',
			'Content-Length': entity.length
		});
		response.end(entity);
	}

	/**
	 * Send response to an OPTIONS request.
	 *
	 * @private
	 * @param {external:"http.ServerResponse"} response The response.
	 * @param {Object.<string,string>} requestHeaders HTTP request headers.
	 * @param {Set.<string>} allowedMethods Allowed HTTP methods.
	 */
	_sendOptionsResponse(response, requestHeaders, allowedMethods) {

		// response headers object
		const responseHeaders = {
			'Content-Length': 0,
			'Vary': 'Accept-Encoding'
		};

		// get allowed HTTP methods from the endpoint handler
		let allowedMethodsList = 'OPTIONS';
		allowedMethods.forEach(
			(method) => {
				allowedMethodsList +=
					', ' + (method === 'GET' ? 'HEAD, GET' : method);
			}
		);
		responseHeaders['Allow'] = allowedMethodsList;

		// set CORS headers if Origin is specified on the request
		const origin = requestHeaders['origin'];
		if (origin) {

			// get the authenticator
			const authService = this._services.get('authenticator');

			// check if the app limits allowed origins
			let originAllowed = false;
			if (this._allowedOriginsPattern) {

				// response varies depending on the origin
				responseHeaders['Vary'] += ', Origin';

				// test the origin
				if (this._allowedOriginsPattern.test(origin)) {
					originAllowed = true;
					responseHeaders['Access-Control-Allow-Origin'] = origin;
					if (authService.usesCredentialedRequests)
						responseHeaders['Access-Control-Allow-Credentials'] =
							'true';
				} else { // origin not allowed
					responseHeaders['Access-Control-Allow-Origin'] = 'null';
				}

			} else { // no origin limitation

				// all origins allowed
				originAllowed = true;

				// credentialed requests cannot use origin wildcard
				if (authService.usesCredentialedRequests) {
					responseHeaders['Vary'] += ', Origin';
					responseHeaders['Access-Control-Allow-Origin'] = origin;
					responseHeaders['Access-Control-Allow-Credentials'] = 'true';
				} else {
					responseHeaders['Access-Control-Allow-Origin'] = '*';
				}
			}

			// more CORS headers if origin allowed
			if (originAllowed) {

				// expose HTTP headers used by the authenticator to the client
				const authHeaders = authService.usedHeaders;
				if (authHeaders)
					responseHeaders['Access-Control-Expose-Headers'] =
						authHeaders.join(', ');

				// allow HTTP methods
				responseHeaders['Access-Control-Allow-Methods'] =
					allowedMethodsList;

				// allow HTTP request headers to go in
				const corsRequestHeaders =
					requestHeaders['access-control-request-headers'];
				if (corsRequestHeaders)
					responseHeaders['Access-Control-Allow-Headers'] =
						corsRequestHeaders;
			}

			// CORS preflight request response expiration (20 days)
			responseHeaders['Access-Control-Max-Age'] = 20 * 24 * 3600;
		}

		// send OK response
		response.writeHead(200, responseHeaders);
		response.end();
	}

	_sendResponse(httpResponse, response, headOnly, actor, httpRequestHeaders) {

		const responseHeaders = {};

		//...
	}
}

module.exports = Application;
