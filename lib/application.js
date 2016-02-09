"use strict";

const util = require('util');
const url = require('url');
const Endpoint = require('./endpoint.js');
const EndpointMapper = require('./endpoint-mapper.js');
const NoAuthenticator = require('./authenticator/no-authenticator.js');
const HeadersSet = require('./headers-set.js');

/**
 * Default header value handler.
 *
 * @private
 */
class DefaultHeaderValueHandler {
	get value() {
		return (this._value || '');
	}
	set value(v) {
		this._value = (v instanceof Date ? v.toUTCString() : String(v));
	}
}

/**
 * Handler for headers, whose value is a list of header names.
 *
 * @private
 */
class HeadersListHeaderValueHandler {
	get value() {
		return (this._value ? Array.from(this._value).join(', ') : '');
	}
	set value(v) {
		if (!this._value)
			this._value = new Set();
		v.trim().split(/\s*,\s*/).forEach(element => {
			this._value.add(HeadersSet.headerCase(element))
		});
	}
}

/**
 * Handler for headers, whose value is a list of HTTP methods.
 *
 * @private
 */
class MethodsListHeaderValueHandler {
	get value() {
		return (this._value ? Array.from(this._value).join(', ') : '');
	}
	set value(v) {
		if (!this._value)
			this._value = new Set();
		v.trim().split(/\s*,\s*/).forEach(element => {
			this._value.add(element.toUpperCase())
		});
	}
}

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

		// save configuration access function and the logger
		this._configFn = configFn;
		this._logger = logger;

		// endpoints
		this._endpoints = new Array();

		// services
		this._serviceProviders = new Map();
		this._serviceProviders.set('authenticator', {
			createService() {
				return new NoAuthenticator();
			}
		});

		// header value handlers
		this._headerValueHandlers = new Map();
		this._headerValueHandlers.set('vary', HeadersListHeaderValueHandler);
		this._headerValueHandlers.set(
			'access-control-allow-headers', HeadersListHeaderValueHandler);
		this._headerValueHandlers.set(
			'access-control-expose-headers', HeadersListHeaderValueHandler);
		this._headerValueHandlers.set('allow', MethodsListHeaderValueHandler);
		this._headerValueHandlers.set(
			'access-control-allow-methods', MethodsListHeaderValueHandler);
		this._headerValueHandlers.set('DEFAULT', DefaultHeaderValueHandler);

		// allowed origin patterns for CORS
		let allowedOriginsPattern = configFn('X2_ALLOWED_SECURE_ORIGINS');
		if (allowedOriginsPattern)
			this._allowedSecureOriginsPattern = new RegExp(
				'^' + allowedOriginsPattern + '$', 'i');
		let allowedOriginsPattern = configFn('X2_ALLOWED_PUBLIC_ORIGINS');
		if (allowedOriginsPattern)
			this._allowedPublicOriginsPattern = new RegExp(
				'^' + allowedOriginsPattern + '$', 'i');

		// the application is not initialized yet
		this._initialized = false;
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

		// make sure the app has not been initialized yet
		if (this._initialized)
			throw new Error(
				'Cannot add endpoint after application initialization.');

		// create and save the endpoint object
		this._endpoints.push(new Endpoint(uriPattern, def));

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

		// make sure the app has not been initialized yet
		if (this._initialized)
			throw new Error(
				'Cannot add resource after application initialization.');

		// TODO:...

		// done
		return this;
	}

	/**
	 * Add multiple resources to the application at once.
	 *
	 * @param {ResourceDefinition[]} defs Resource definitions.
	 * @returns {Application} This application for chaining.
	 */
	resources(defs) {

		// add each resource
		defs.forEach(def => { this.resource(def); });

		// done
		return this;
	}

	/**
	 * Add service to the application.
	 *
	 * @param {string} name Service name.
	 * @param {*} service Service provider (factory).
	 * @returns {Application} This application for chaining.
	 */
	service(name, serviceProvider) {

		// make sure the app has not been initialized yet
		if (this._initialized)
			throw new Error(
				'Cannot add service after application initialization.');

		// save service provider
		this._serviceProviders.set(name, serviceProvider);

		// done
		return this;
	}


	/**
	 * Get HTTP response header handler.
	 *
	 * @function Application#headerValueHandler
	 * @param {string} name All lower-case HTTP header name.
	 * @returns {HeaderValueHandler} New empty handler.
	 */
	/**
	 * Register custom HTTP response header handler. The method can be called
	 * only before the application is initialized.
	 *
	 * @param {string} name All lower-case HTTP header name.
	 * @param {function} handlerConstructor Constructor of
	 * {@link HeaderValueHandler}.
	 * @returns {Application} This application for chaining.
	 */
	headerValueHandler(name, handlerConstructor) {

		// check if getting the handler
		if (!handlerConstructor)
			return new (
				this._headerValueHandlers.get(name)
					|| this._headerValueHandlers.get('DEFAULT')
			);

		// make sure the app has not been initialized yet
		if (this._initialized)
			throw new Error(
				'Cannot register header value handler after application'
					+ ' initialization.');

		// register handler
		this._headerValueHandlers.set(name, handlerConstructor);

		// done
		return this;
	}


	/**
	 * Initialize the application.
	 *
	 * <p>If the application has not been initialized by the first invocation of
	 * {@link #respond}, it will be initialized automatically. However, the
	 * application may want to explicitely call this method so that
	 * initialization does not take time from the first API call response.
	 *
	 * <p>An application instance can be initialized only once.
	 */
	init() {

		// make sure the app has not been initialized yet
		if (this._initialized)
			throw new Error('The application is already initialized.');

		// log it
		this._logger.info('initalizing the application');

		// configure service providers
		this._serviceProviders.forEach((serviceProvider, serviceName) => {
			if (typeof serviceProvider.configure === 'function') {
				this._logger.debug(
					'configuring service provider %s', serviceName);
				serviceProvider.configure(
					this._configFn, this._logger, this._serviceProviders);
			}
		});

		// instantiate services
		this._services = new Map();
		this._serviceProviders.forEach((serviceProvider, serviceName) => {
			this._logger.debug(
				'instantiating service %s', serviceName);
			this._services.set(serviceName, serviceProvider.createService());
		});
		delete this._serviceProviders;

		// create endpoint mapper
		this._endpointMapper = new EndpointMapper(
			this._endpoints, this._configFn);
		delete this._endpoints;

		//...

		// done
		this._initialized = true;
	}

	/**
	 * Gracefully shutdown the application.
	 */
	shutdown() {

		// log it
		this._logger.info('shutting down the application');

		// TODO: implement
	}


	/**
	 * Respond to a request.
	 *
	 * @param {external:"http.IncomingMessage"} httpRequest The request.
	 * @param {external:"http.ServerResponse"} httpResponse The response.
	 */
	respond(httpRequest, httpResponse) {

		// create endpoint mapper if necessary
		if (!this._initialized)
			this.init();

		// parse request URL
		const requestUrl = url.parse(httpRequest.url, true);

		// lookup the endpoint
		const match = this._endpointMapper.lookup(requestUrl);
		if (!match)
			return this._sendErrorResponse(
				httpResponse, 404, 'X2-404-1', 'No API endpoint at this URI.');

		// get an endpoint call
		if (this._logger.isDebugEnabled())
			this._logger.debug(
				'received endpoint request %s %s', httpRequest.method,
				match.resourceUri);

		// get allowed methods from the handler
		const allowedMethods =
			match.handler.getAllowedMethods(match.resourceUri, match.uriParams);

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
		this._services.get('authenticator')
			.authenticate(httpRequest, requestUrl)
			.then(
				(actor) => {

					// check if actor is allowed to make the call
					if (!match.handler.isAllowed(
						httpRequest.method, match.resourceUri, match.uriParams,
						actor)) {
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
							  + 'URI: ' + match.resourceUri + '\r\n'
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
			'Content-Length': 0
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
				responseHeaders['Vary'] = 'Origin';

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
					responseHeaders['Vary'] = 'Origin';
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

	_sendResponse(
		httpResponse, resourceUri, uriParams, response,
		handler, actor, requestUrl, httpRequestHeaders, headOnly) {

		// depends on the status code???
		//...

		// get authenticator
		const authService = this._services.get('authenticator');

		// response always depends on "Origin" header
		response.header('vary', 'origin');

		// more vary headers from the auth service and the handler???
		//...

		// add CORS headers if cross-origin request
		const origin = httpRequestHeaders['origin'];
		if (origin) {

			// test if the origin is allowed
			let allowedOrigin = true;
			if (this._allowedPublicOriginsPattern
				&& handler.isPublic(resourceUri, uriParams)
				&& this._allowedPublicOriginsPattern.test(origin)) {
				response.header('access-control-allow-origin', origin);
			} else if (!this._allowedSecureOriginsPattern) {
				response.header('access-control-allow-origin', '*');
			} else if (this._allowedSecureOriginsPattern.test(origin)) {
				response.header('access-control-allow-origin', origin);
				response.header('access-control-allow-credentials', 'true');
			} else {
				allowedOrigin = false;
			}

			// add exposed headers
			if (allowedOrigin) {
				authService.usedResponseHeaders.forEach(header => {
					response.header('access-control-expose-headers', header);
				});
				handler.usedResponseHeaders.forEach(header => {
					response.header('access-control-expose-headers', header);
				});
			}
		}

		// add authentication related headers
		authService.addResponseAuthInfo(
			response, actor, requestUrl, httpRequestHeaders);

		// cache control??? by default no-cache?
		// levels: sensitive (no store), normal (no cache), cachable (exp., public/protected)
		//...

		// start assembling HTTP response headers
		const httpResponseHeaders = {};

		// apply HTTP response headers from the handler response
		//...

		// buffer or stream?
		//...
	}
}

module.exports = Application;
