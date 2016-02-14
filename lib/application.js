"use strict";

const util = require('util');
const url = require('url');
const Endpoint = require('./endpoint.js');
const EndpointMapper = require('./endpoint-mapper.js');
const NoAuthenticator = require('./authenticator/no-authenticator.js');
const HeadersSet = require('./headers-set.js');
const DefaultHeaderValueHandler =
	require('./header-value-handler/default-header-value-handler.js');
const HeadersListHeaderValueHandler =
	require('./header-value-handler/headers-list-header-value-handler.js');
const MethodsListHeaderValueHandler =
	require('./header-value-handler/methods-list-header-value-handler.js');

/**
 * The application, which is a central piece of the framework representing the
 * server-side application that exposes a RESTful API.
 *
 * <p>The application is customized by registering three types of components:
 *
 * <dl>
 * <dt>Resources<dd>The framework's notion of the <em>resource</em> is different
 * from the one used by the HTTP specification, where resource is simply what's
 * behind a URI (and is identified by it). The application resource is a
 * definition of a collection of records (called <em>resource records</em>, or
 * <em>resource instances</em>) of the same type, normally stored in the
 * persistent storage used by the application (such as a database). Each such
 * resource, when its definition is registered, is associated with a unique name,
 * but not an HTTP URI. It is a task of another component, the <em>endpoint</em>,
 * to map a URI exposed by the application's API to a particular application
 * resource.
 * <dt>Endpoints<dd>An <em>endpoint</em>, as in the application API endpoint, is
 * a component associated with a certain HTTP URI pattern and responsible for
 * providing the application API logic.
 * <dt>Services<dd>A <em>service</em> is a singleton component that provides
 * logic to the application endpoint handlers, other services, as well as other
 * framework components. A registered service is identified by a name. The
 * framework's core itself uses certain services registered under some standard
 * names. Default implementations of these services are pre-registered by the
 * framework but can be, and often are, overridden by the custom code.
 * </dl>
 *
 * <p>These components are registred by the custom code after the application is
 * instantiated but before it is initialized. The application is ready to start
 * responding to the API calls after the initialization. Once the application is
 * initialized, components can no longer be registered.
 *
 * <p>The application uses configuration access function to adjust operation of
 * its components according to the environment. Certain configuration parameters
 * are predefined and used by the core, while other components may use their own
 * configuration parameters. The configuration parameters used by the core are:
 *
 * <dl>
 * <dt>X2_ALLOWED_SECURE_ORIGINS<dd>Optional regular expression pattern for
 * allowed
 * {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control_CORS|CORS}
 * origins. The matching origins are considered <em>secure</em>, meaning that
 * credentialed requests are allowed from these origins. If not specified, all
 * origins are allowed.
 * <dt>X2_ALLOWED_PUBLIC_ORIGINS<dd>In addition to
 * <code>X2_ALLOWED_SECURE_ORIGINS</code> this regular expression pattern allows
 * more origins, but origins that match this pattern but do not match
 * <code>X2_ALLOWED_SECURE_ORIGINS</code> are not allowed to issue credentialed
 * requests. This pattern can be used in rare cases when access to certain public
 * resources exposed by the application API (see
 * {@link EndpointHandler#isPublic}) must be allowed from more origins. The
 * parameter is used only if <code>X2_ALLOWED_SECURE_ORIGINS</code> is
 * specified. If not, this parameter is ignored.
 * <dt>X2_ENDPOINTS_PREFIX<dd>Optional prefix added to all endpoint URIs. Note,
 * that the use of this configuration parameter is transparent to the
 * application, because whenever the framework provides the requested resource
 * URI to the application components, the resource URI is stripped of this
 * prefix.
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

		// known HTTP methods
		this._knownHttpMethods = new Set([
			'OPTIONS',
			'GET',
			'HEAD',
			'POST',
			'PUT',
			'PATCH',
			'DELETE'
		]);

		// "simple" response headers
		this._simpleResponseHeaders = new Set([
			'cache-control',
			'content-language',
			'content-type',
			'expires',
			'last-modified',
			'pragma'
		]);

		// allowed origin patterns for CORS
		let allowedOriginsPattern = configFn('X2_ALLOWED_SECURE_ORIGINS');
		if (allowedOriginsPattern) {
			this._allowedSecureOriginsPattern = new RegExp(
				'^' + allowedOriginsPattern + '$', 'i');
			allowedOriginsPattern = configFn('X2_ALLOWED_PUBLIC_ORIGINS');
			if (allowedOriginsPattern)
				this._allowedPublicOriginsPattern = new RegExp(
					'^' + allowedOriginsPattern + '$', 'i');
		}

		// the application is not initialized yet
		this._initialized = false;
	}


	/**
	 * Add API endpoint to the application.
	 *
	 * @param {string} uriPattern Endpoint URI regular expression pattern. URI
	 * parameters are groups in the pattern.
	 * @param {EndpointDefinition} def Endpoint definition object.
	 * @returns This object for chaining.
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
	 * @returns This object for chaining.
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
	 * @returns This object for chaining.
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
	 * @returns This object for chaining.
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
	 * @returns This object for chaining.
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
	 * @param {external:"http.IncomingMessage"} httpRequest The HTTP request.
	 * @param {external:"http.ServerResponse"} httpResponse The HTTP response.
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

		// log the endpoint call
		if (this._logger.isDebugEnabled())
			this._logger.debug(
				'received endpoint request %s %s', httpRequest.method,
				match.resourceUri);

		// check if the method is known
		if (!this._knownHttpMethods.has(httpRequest.method))
			return this._sendErrorResponse(
				httpResponse, 501, 'X2-501-1', 'Unsupported HTTP method.');

		// get allowed methods from the handler
		const allowedMethods =
			match.handler.getAllowedMethods(match.resourceUri, match.uriParams);

		// respond to an OPTIONS request
		if (httpRequest.method === 'OPTIONS')
			return this._sendOptionsResponse(
				httpResponse, httpRequest.headers, allowedMethods);

		//------------

		// check if HEAD request
		const headRequest = (httpRequest.method === 'HEAD');

		// verify that the method is allowed TODO: add Allow
		if (!allowedMethods.has(headRequest ? 'GET' : httpRequest.method))
			return this._sendErrorResponse(
				httpResponse, 405, 'X2-405-1',
				'Method not supported by the API.');

		// authenticate the request
		this._services.get('authenticator')
			.authenticate(httpRequest, requestUrl)
			.then(
				actor => {

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
	 * Send HTTP error response. The method is used only for very basic errors
	 * generated before the endpoint call context can be formed.
	 *
	 * @private
	 * @param {external:"http.ServerResponse"} httpResponse The HTTP response.
	 * @param {number} httpResponseCode HTTP response code.
	 * @param {string} errorCode Application error code.
	 * @param {string} errorMessage Error message.
	 */
	_sendErrorResponse(
		httpResponse, httpResponseCode, errorCode, errorMessage) {

		const entityObj = {
			errorCode: errorCode,
			errorMessage: errorMessage
		};
		const entity = JSON.stringify(entityObj);

		httpResponse.writeHead(httpResponseCode, {
			'Content-Type': 'application/json',
			'Content-Length': Buffer.byteLength(entity)
		});
		httpResponse.end(entity);
	}

	/**
	 * Send response to an OPTIONS request.
	 *
	 * @private
	 * @param {external:"http.ServerResponse"} httpResponse The HTTP response.
	 * @param {Object.<string,string>} requestHeaders HTTP request headers.
	 * @param {Set.<string>} allowedMethods Allowed HTTP methods.
	 */
	_sendOptionsResponse(httpResponse, requestHeaders, allowedMethods) {

		// create response headers set
		const responseHeaders = new HeadersSet(this);

		// list allowed methods
		allowedMethods.forEach(
			method => {
				responseHeaders.header(
					'Allow', (method === 'GET' ? 'GET, HEAD' : method));
			}
		);
		responseHeaders.header('Allow', 'OPTIONS');

		// add zero content length header
		responseHeaders.header('Content-Length', 0);

		// response always varies depending on the "Origin" header
		responseHeaders.header('Vary', 'Origin');

		// process CORS preflight request
		const origin = requestHeaders['origin'];
		const requestedMethod = requestHeaders['access-control-request-method'];
		if (origin && requestedMethod) {

			// check if origin is allowed
			let allowedOrigin;
			if (this._allowedPublicOriginsPattern
				&& handler.isPublic(resourceUri, uriParams)
				&& this._allowedPublicOriginsPattern.test(origin)) {
				allowedOrigin = 'ALLOWED_SPECIFIC';
			} else if (!this._allowedSecureOriginsPattern) {
				allowedOrigin = 'ALLOWED_ANY';
			} else if (this._allowedSecureOriginsPattern.test(origin)) {
				allowedOrigin = 'ALLOWED_SPECIFIC_PLUS_CRED';
			} else {
				allowedOrigin = 'DISALLOWED';
			}

			// proceed if allowed origin and method
			if (allowedOrigin !== 'DISALLOWED') {

				// allow the origin
				responseHeaders.header(
					'Access-Control-Allow-Origin',
					(allowedOrigin === 'ALLOWED_ANY' ? '*' : origin));

				// allow credentials, if allowed
				if (allowedOrigin === 'ALLOWED_SPECIFIC_PLUS_CRED')
					responseHeaders.header(
						'Access-Control-Allow-Credentials', 'true');

				// allow caching of the preflight response (for 20 days)
				responseHeaders.header('Access-Control-Max-Age', 20 * 24 * 3600);

				// allow method and headers
				responseHeaders.header(
					'Access-Control-Allow-Method', requestedMethod);
				const requestedHeaders =
					requestHeaders['access-control-request-headers'];
				if (requestedHeaders)
					responseHeaders.header(
						'Access-Control-Allow-Headers', requestedHeaders);
			}
		}

		// send OK response
		httpResponse.writeHead(200, responseHeaders.headers);
		httpResponse.end();
	}

	/**
	 * Send response to an endpoint call.
	 *
	 * TODO: add parameters
	 */
	_sendResponse(
		httpResponse, resourceUri, uriParams, response,
		handler, actor, requestUrl, httpRequestHeaders, headOnly) {

		// depends on the status code???
		//...

		// get authenticator
		const authService = this._services.get('authenticator');

		// response always varies depending on the "Origin" header
		response.header('Vary', 'Origin');

		// add CORS headers if cross-origin request
		const origin = httpRequestHeaders['origin'];
		if (origin) {

			// test if the origin is allowed
			let allowedOrigin = true;
			if (this._allowedPublicOriginsPattern
				&& handler.isPublic(resourceUri, uriParams)
				&& this._allowedPublicOriginsPattern.test(origin)) {
				response.header('Access-Control-Allow-Origin', origin);
			} else if (!this._allowedSecureOriginsPattern) {
				response.header('Access-Control-Allow-Origin', '*');
			} else if (this._allowedSecureOriginsPattern.test(origin)) {
				response.header('Access-Control-Allow-Origin', origin);
				response.header('Access-Control-Allow-Credentials', 'true');
			} else {
				allowedOrigin = false;
			}

			// add exposed headers, if origin allowed
			if (allowedOrigin)
				(authService.exposedResponseHeaders || [])
				.concat(handler.exposedResponseHeaders || [])
				.filter(
					h => !this._simpleResponseHeaders.has(h.toLowerCase()))
				.forEach(
					h => {
						response.header('Access-Control-Expose-Headers', h);
					});
		}

		// add authentication related headers
		authService.addResponseAuthInfo(
			response, actor, requestUrl, httpRequestHeaders);

		// cache control??? by default no-cache?
		// levels: sensitive (no store), normal (no cache), cachable (exp., public/protected)
		//...

		// start assembling HTTP response headers
		const httpResponseHeaders = {};

		// buffer or stream?
		//...
	}
}

module.exports = Application;
