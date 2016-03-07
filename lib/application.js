"use strict";

const url = require('url');
const util = require('./util.js');

const Endpoint = require('./endpoint.js');
const EndpointMapper = require('./endpoint-mapper.js');
const EndpointCallResponse = require('./endpoint-call-response.js');
const Runtime = require('./runtime.js');
const EndpointCallContext = require('./endpoint-call-context.js');

const DefaultHeaderValueHandler =
	require('./header-value-handler/default-header-value-handler.js');
const HeadersListHeaderValueHandler =
	require('./header-value-handler/headers-list-header-value-handler.js');
const MethodsListHeaderValueHandler =
	require('./header-value-handler/methods-list-header-value-handler.js');

const BasicAuthenticatorProvider =
	require('./authenticator/basic-authenticator.js');
const NoopActorRegistryProvider =
	require('./actor-registry/noop-actor-registry.js');
const ActorRegistryCacheProvider =
	require('./actor-registry/actor-registry-cache.js');
const JsonMarshallerProvider = require('./marshaller/json-marshaller.js');

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
 * more origins, but origins that match this pattern and do not match
 * <code>X2_ALLOWED_SECURE_ORIGINS</code> are not allowed to issue credentialed
 * requests. This pattern can be used in rare cases when access to certain public
 * resources exposed by the application API (see
 * {@link EndpointHandler#isPublic}) must be allowed from more origins. The
 * parameter is used only if <code>X2_ALLOWED_SECURE_ORIGINS</code> is
 * specified. If not, the parameter is ignored.
 * <dt>X2_ENDPOINTS_PREFIX<dd>Optional prefix added to all endpoint URIs. Note,
 * that the use of this configuration parameter is transparent to the
 * application, because whenever the framework provides the requested resource
 * URI to the application components, the resource URI is stripped of this
 * prefix.
 * <dt>X2_MAX_REQUEST_SIZE<dd>Maximum allowed request entity size in bytes. In
 * the case of multipart requests, this limit applies only to the first part
 * (considered the request entity, while the subsequent parts are considered
 * attachments and are handed over to the handlers as streams). The default is
 * 2048.
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
		this._serviceProviders.set(
			'authenticator', new BasicAuthenticatorProvider());
		this._serviceProviders.set(
			'actorRegistry', new NoopActorRegistryProvider());
		this._serviceProviders.set(
			'actorRegistryCache', new ActorRegistryCacheProvider());
		this._serviceProviders.set(
			'marshaller:application/json', new JsonMarshallerProvider());

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

		// cacheable HTTP response codes
		this._cacheableStatusCodes = new Array();
		[
			200, 203, 204, 206, 300, 301, 304, 308, 404, 405, 410, 414, 501
		].forEach(statusCode => {
			this._cacheableStatusCodes[statusCode] = true;
		});

		// "simple" response headers
		this._simpleResponseHeaders = new Set([
			'cache-control',
			'content-language',
			'content-type',
			'expires',
			'last-modified',
			'pragma'
		]);

		// multipart boundary
		this._boundary = 'thymes2js_boundary_gc0p4Jq0M2Yt08j34c0p';

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

		// maximum request size
		this._maxRequestSize = (Number(configFn('X2_MAX_REQUEST_SIZE')) || 2048);

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
	 * @param {ServiceProvider} serviceProvider Service provider.
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
	 *
	 * @returns This application.
	 */
	init() {

		// make sure the app has not been initialized yet
		if (this._initialized)
			throw new Error('The application is already initialized.');

		// make application initialized
		this._initialized = true;

		// log it
		this._logger.info('initalizing the application');

		// perform application initialization
		try {

			// configure service providers and build initialization sequence
			const serviceInitSequence = new Set();
			const serviceDepsChain = new Set();
			this._serviceProviders.forEach((serviceProvider, serviceName) => {

				// configure service provider is necessary
				if (typeof serviceProvider.configure === 'function') {
					this._logger.debug(
						'configuring service provider "%s"', serviceName);
					serviceProvider.configure(
						this._configFn, this._logger, this._serviceProviders);
				}

				// add services to the initialization sequence
				this._addToServiceInitSequence(
					serviceName, serviceProvider, serviceInitSequence,
					serviceDepsChain);
			});

			// create runtime
			this._services = new Map();
			this._runtime =
				new Runtime(this._configFn, this._logger, this._services);

			// instantiate services
			serviceInitSequence.forEach(serviceName => {
				this._logger.debug('instantiating service "%s"', serviceName);
				this._services.set(
					serviceName,
					this._serviceProviders.get(serviceName).createService(
						this._runtime));
			});
			delete this._serviceProviders; // no need for the providers anymore

			// create endpoint mapper
			this._endpointMapper = new EndpointMapper(
				this._endpoints, this._configFn);
			delete this._endpoints; // the endpoints are in the mapper now

			// ready to serve
			this._logger.info('ready to accept requests');

		} catch (err) {
			this._logger.error(
				'error initializing the application: %s', err.message);
			this.shutdown();
			throw err;
		}

		// done
		return this;
	}

	/**
	 * Recursively process service provider and add the service and services, on
	 * that which it depends to the service initialization sequence.
	 *
	 * @private
	 * @param {string} serviceName Service name.
	 * @param {ServiceProvider} serviceProvider Service provider.
	 * @param {Set.<string>} serviceInitSequence Service initialization sequence
	 * being built.
	 * @param {Set.<string>} serviceDepsChain Service dependencies chain.
	 */
	_addToServiceInitSequence(
		serviceName, serviceProvider, serviceInitSequence, serviceDepsChain) {

		// check if already in the initialization sequence
		if (serviceInitSequence.has(serviceName))
			return;

		// check if circular dependency
		if (serviceDepsChain.has(serviceName))
			throw new Error(
				'Circular dependency for service "' + serviceName + '": '
					+ serviceDepsChain);

		// add services, on which this one depends first
		const deps = serviceProvider.dependencies;
		if (deps && (deps.length > 0)) {
			serviceDepsChain.add(serviceName);
			deps.forEach(depServiceName => {
				const depServiceProvider =
					this._serviceProviders.get(depServiceName);
				if (!depServiceProvider)
					throw new Error(
						'Service "' + serviceName
							+ '" depends on unknown service "'
							+ depServiceName + '".');
				this._addToServiceInitSequence(
					depServiceName, depServiceProvider, serviceInitSequence,
					serviceDepsChain);
			});
			serviceDepsChain.delete(serviceName);
		}

		// add service to the initalization sequence
		serviceInitSequence.add(serviceName);
	}

	/**
	 * Gracefully shutdown the application.
	 */
	shutdown() {

		// check if initialized and not shutdown
		if (!this._initialized || this._shutdiwn)
			return;

		// disable responding to calls
		this._shutdown = true;

		// log it
		this._logger.info('shutting down the application');

		// shutdown the services
		Array.from(this._services.entries()).reverse().forEach(entry => {
			const service = entry[1];
			if (typeof service.shutdown === 'function') {
				this._logger.debug('shutting down service %s', entry[0]);
				try {
					service.shutdown();
				} catch (err) {
					this._logger.error(
						'error shutting down service %s: ', entry[0], err);
				}
			}
		});

		// free runtime and the services
		delete this._runtime;
		delete this._services;
	}

	/**
	 * Respond to a request.
	 *
	 * @param {external:"http.IncomingMessage"} httpRequest The HTTP request.
	 * @param {external:"http.ServerResponse"} httpResponse The HTTP response.
	 */
	respond(httpRequest, httpResponse) {

		/*httpResponse.on('timeout', (socket) => {
			console.log('>>> HTTP RESP TIMEOUT');
		});
		httpResponse.on('error', () => {
			console.log('>>> HTTP RESP ERROR');
		});
		httpResponse.on('close', () => {
			console.log('>>> HTTP RESP CLOSE');
		});
		httpResponse.on('finish', () => {
			console.log('>>> HTTP RESP FINISH');
		});*/

		// check if application has been shut down
		if (this._shutdown) {
			httpResponse.writeHead(503);
			httpResponse.end();
			return;
		}

		// initialize the application if necessary
		if (!this._initialized)
			this.init();

		// create endpoint call object and initiate the call processing
		try {
			(new EndpointCall(this, httpRequest, httpResponse)).process();
		} catch (err) {
			this._logger.error(err.stack);
			httpResponse.writeHead(500);
			httpResponse.end();
		}
	}
}

/**
 * Endpoint call processor. A single instance drives handling of a single
 * request.
 *
 * @private
 */
class EndpointCall {

	/**
	 * Create new processor for a request.
	 *
	 * @param {Application} app The application.
	 * @param {external:"http.IncomingMessage"} httpRequest The HTTP request.
	 * @param {external:"http.ServerResponse"} httpResponse The HTTP response.
	 * @throws {Error} Unexpected internal server error.
	 */
	constructor(app, httpRequest, httpResponse) {

		// initial properties:

		this._app = app;
		this._httpRequest = httpRequest;
		this._httpResponse = httpResponse;

		this._requestUrl = url.parse(httpRequest.url, true);

		// the properties below are set at various points during the processing:

		this._endpointMatch = null;
		this._allowedMethods = null;

		this._authResult = null;
		this._responseActor = null;
		this._validateRequestEntity = null;

		this._ctx = null;
	}


	/**
	 * Initiate the asynchronous chain of endpoint call processing.
	 */
	process() {

		try {

			// used refs
			const app = this._app;
			const method = this._httpRequest.method;

			// lookup the endpoint
			this._endpointMatch = app._endpointMapper.lookup(this._requestUrl);
			if (!this._endpointMatch)
				return this._sendResponse(
					(new EndpointCallResponse(app, 404)).entity({
						errorCode: 'X2-404-1',
						errorMessage: 'No API endpoint at this URI.'
					}));

			// log the endpoint call
			if (app._logger.isDebugEnabled())
				app._logger.debug(
					'received endpoint request %s %s', method,
					this._endpointMatch.resourceUri);

			// check if the method is known
			if (!app._knownHttpMethods.has(method))
				return this._sendResponse(
					(new EndpointCallResponse(app, 501)).entity({
						errorCode: 'X2-501-1',
						errorMessage: 'Unsupported HTTP method.'
					}));

			// get allowed methods from the handler
			this._allowedMethods = this._endpointMatch.handler.getAllowedMethods(
				this._endpointMatch.resourceUri, this._endpointMatch.uriParams);

			// respond to an OPTIONS request
			if (method === 'OPTIONS')
				return this._sendOptionsResponse();

			// verify that the method is allowed
			if (!this._allowedMethods.has(method === 'HEAD' ? 'GET' : method)) {
				const response = new EndpointCallResponse(app, 405);
				this._allowedMethods.forEach(
					method => {
						response.header(
							'Allow', (method === 'GET' ? 'GET, HEAD' : method));
					}
				);
				response.header('Allow', 'OPTIONS');
				response.entity({
					errorCode: 'X2-405-1',
					errorMessage: 'Method not supported by the API endpoint.'
				});
				return this._sendResponse(response);
			}

			// authenticate the request and continue processing after that
			this._app._services.get('authenticator')
				.authenticate(this._httpRequest, this._requestUrl)
				.then(
					this._process1.bind(this),
					this._sendInternalServerErrorResponse.bind(this)
				);

		} catch (err) {
			this._sendInternalServerErrorResponse(err);
		}
	}

	/**
	 * Continue endpoint call processing after authentication.
	 *
	 * @private
	 * @param {AuthenticationResult} authResult Authentication result.
	 */
	_process1(authResult) {

		try {

			// save authentication information
			this._authResult = authResult;
			this._responseActor = authResult.actor;

			// used refs
			const endpointMatch = this._endpointMatch;
			const method = this._httpRequest.method;

			// check if actor is allowed to make the call
			if (!endpointMatch.handler.isAllowed(
				method, endpointMatch.resourceUri, endpointMatch.uriParams,
				this._authResult.actor)) {

				// check if could not authenticate and challenge if so
				if (this._authResult.actor === null)
					return this._sendResponse(
						(new EndpointCallResponse(this._app, 401)).header(
							'WWW-Authenticate', this._authResult.challenge
						).entity({
							errorCode: 'X2-401-1',
							errorMessage: 'Authentication required.'
						}));

				// authenticated, but not authorized
				return this._sendResponse(
					(new EndpointCallResponse(this._app, 403)).entity({
						errorCode: 'X2-403-1',
						errorMessage: 'Insufficient permissions.'
					}));
			}

			// get request entity validator
			this._validateRequestEntity = (
				endpointMatch.handler.getRequestEntityValidator
					&& endpointMatch.handler.getRequestEntityValidator(
						method, endpointMatch.resourceUri,
						endpointMatch.uriParams)
			);

			// read the request entity if expected
			if (this._validateRequestEntity) {

				// get top content type
				const topCType = (
					this._httpRequest.headers['content-type']
						|| 'application/octet-stream');

				// check if multipart
				if (/^multipart\//i.test(topCType)) {

					// TODO:...

				} else { // not multipart

					// find marshaller for deserialization
					const marshaller = this._app._services.get(
						'marshaller:' + topCType.split(/;\s*/)[0].toLowerCase());
					if (!marshaller)
						return this._sendResponse(
							(new EndpointCallResponse(this._app, 415)).entity({
								errorCode: 'X2-415',
								errorMessage:
									'Unsupported request entity content type.'
							}));

					// check content length
					if (Number(this._httpRequest.headers['content-length'])
						> this._app._maxRequestSize)
						return this._sendResponse(
							(new EndpointCallResponse(this._app, 413)).entity({
								errorCode: 'X2-413',
								errorMessage:
									'The request entity is too large.'
							}).header('Connection', 'close'));

					// TODO: set timeout for input data
					/*this._httpRequest.setTimeout(1000, socket => {
						// TODO: send 418, close
						console.log('timeout:');
						console.log(socket);
					});*/

					// read the entity data
					const dataBufs = new Array();
					let bytesRead = 0;
					this._httpRequest
						.on('data', chunk => {
							if ((bytesRead += chunk.length)
								> this._app._maxRequestSize);
							// TODO: send error and stop reading
							dataBufs.push(chunk);
						})
						.on('end', () => {
							// TODO: parse the data
							try {
								this._process2(
									marshaller.deserialize(
										dataBufs.length === 1 ?
											dataBufs[0] :
											Buffer.concat(dataBufs)),
									null);
							} catch (err) {
								// TODO: syntax error, general error
							}
						})
						.on('error', err => {
							// TODO: what to do?
							console.log('reading request error: ', err);
						});

					// TODO:...
				}

			} else { // no request entity is expected, proceed with processing
				this._process2(null, null);
			}

		} catch (err) {
			this._sendInternalServerErrorResponse(err);
		}
	}

	/**
	 * Continue endpoint call processing after getting the request entity.
	 *
	 * @param {?Object} requestEntity Parsed request entity, or <code>null</code>
	 * if none.
	 * @param {?Iterator.<HttpEntity>} requestAttachments Additional request
	 * entities for a multipart request, or <code>null</code> if none.
	 */
	_process2(requestEntity, requestAttachments) {

		try {

			// TODO: validate entity
			console.log('>>> got request entity:');
			console.log(requestEntity);

			// create call context
			this._ctx = new EndpointCallContext(
				this._app, this._app._runtime, this._authResult.actor,
				requestEntity, requestAttachments);

			// call the handler
			Promise.resolve(this._endpointMatch.handler.handleCall(this._ctx))
				.then(
					this._process3.bind(this),
					this._sendInternalServerErrorResponse.bind(this)
				);

		} catch (err) {
			this._sendInternalServerErrorResponse(err);
		}
	}

	/**
	 * Continue endpoint call processing after receiving result from the handler.
	 *
	 * @private
	 * @param {?(EndpointCallResponse|Object)} result Result returned by the
	 * handler.
	 */
	_process3(result) {

		try {

			// get the call response object
			let response;
			if (result instanceof EndpointCallResponse)
				response = result;
			else if (result === null)
				response = new EndpointCallResponse(this._app, 204);
			else
				response = new EndpointCallResponse(this._app, 200).entity(
					result);

			// update response actor
			this._responseActor = this._ctx.actor;

			// send the response
			this._sendResponse(response);

		} catch (err) {
			this._sendInternalServerErrorResponse(err);
		}
	}


	/**
	 * Send HTTP 500 (Internal Server Error) response as a reaction to an
	 * unexpected error.
	 *
	 * @private
	 * @param {Error} err The error that caused the 500 response.
	 */
	_sendInternalServerErrorResponse(err) {

		this._app._logger.error(err.stack);

		this._sendResponse(
			(new EndpointCallResponse(this._app, 500)).entity({
				errorCode: 'X2-500',
				errorMessage: 'Internal server error.'
			}));
	}

	/**
	 * Send response to an OPTIONS request.
	 *
	 * @private
	 */
	_sendOptionsResponse() {

		// create response headers set
		const response = new EndpointCallResponse(this._app, 200);

		// list allowed methods
		this._allowedMethods.forEach(
			method => {
				response.header(
					'Allow', (method === 'GET' ? 'GET, HEAD' : method));
			}
		);
		response.header('Allow', 'OPTIONS');

		// add zero content length header
		response.header('Content-Length', 0);

		// response always varies depending on the "Origin" header
		response.header('Vary', 'Origin');

		// process CORS preflight request
		const origin = this._httpRequest.headers['origin'];
		const requestedMethod =
			this._httpRequest.headers['access-control-request-method'];
		if (origin && requestedMethod) {

			// check if origin is allowed
			let allowedOrigin;
			if (this._app._allowedPublicOriginsPattern
				&& this._endpointMatch.handler.isPublic(
					this._endpointMatch.resourceUri,
					this._endpointMatch.uriParams)
				&& this._app._allowedPublicOriginsPattern.test(origin)) {
				allowedOrigin = 'ALLOWED_SPECIFIC';
			} else if (!this._app._allowedSecureOriginsPattern) {
				allowedOrigin = 'ALLOWED_ANY';
			} else if (this._app._allowedSecureOriginsPattern.test(origin)) {
				allowedOrigin = 'ALLOWED_SPECIFIC_PLUS_CRED';
			} else {
				allowedOrigin = 'DISALLOWED';
			}

			// proceed if allowed origin and method
			if (allowedOrigin !== 'DISALLOWED') {

				// allow the origin
				response.header(
					'Access-Control-Allow-Origin',
					(allowedOrigin === 'ALLOWED_ANY' ? '*' : origin));

				// allow credentials, if allowed
				if (allowedOrigin === 'ALLOWED_SPECIFIC_PLUS_CRED')
					response.header('Access-Control-Allow-Credentials', 'true');

				// allow caching of the preflight response (for 20 days)
				response.header('Access-Control-Max-Age', 20 * 24 * 3600);

				// allow method and headers
				response.header('Access-Control-Allow-Method', requestedMethod);
				const requestedHeaders =
					this._httpRequest.headers['access-control-request-headers'];
				if (requestedHeaders)
					response.header(
						'Access-Control-Allow-Headers', requestedHeaders);
			}
		}

		// send OK response
		this._httpResponse.writeHead(response.statusCode, response.headers);
		this._httpResponse.end();
	}

	/**
	 * Send normal response to the endpoint call.
	 *
	 * @private
	 * @param {EndpointCallResponse} response The response to send.
	 */
	_sendResponse(response) {

		// used refs
		const app = this._app;
		const authService = app._services.get('authenticator');
		const method = this._httpRequest.method;
		const httpRequestHeaders = this._httpRequest.headers;
		const endpointMatch = this._endpointMatch;

		// response always varies depending on the "Origin" header
		response.header('Vary', 'Origin');

		// add CORS headers if cross-origin request
		const origin = httpRequestHeaders['origin'];
		if (origin) {

			// test if the origin is allowed
			let allowedOrigin = true;
			if (app._allowedPublicOriginsPattern
				&& endpointMatch
				&& endpointMatch.handler.isPublic(
					endpointMatch.resourceUri, endpointMatch.uriParams)
				&& app._allowedPublicOriginsPattern.test(origin)) {
				response.header('Access-Control-Allow-Origin', origin);
			} else if (!app._allowedSecureOriginsPattern) {
				response.header('Access-Control-Allow-Origin', '*');
			} else if (app._allowedSecureOriginsPattern.test(origin)) {
				response.header('Access-Control-Allow-Origin', origin);
				response.header('Access-Control-Allow-Credentials', 'true');
			} else {
				allowedOrigin = false;
			}

			// add exposed headers, if origin allowed
			if (allowedOrigin)
				(authService.exposedResponseHeaders || [])
				.concat((
					endpointMatch && endpointMatch.handler.exposedResponseHeaders
				) || [])
				.filter(
					h => !app._simpleResponseHeaders.has(h.toLowerCase()))
				.forEach(
					h => {
						response.header('Access-Control-Expose-Headers', h);
					});
		}

		// add authentication related headers
		authService.addResponseAuthInfo(
			response, this._authResult, this._responseActor, this._requestUrl,
			httpRequestHeaders);

		// default response cache control
		const statusCode = response.statusCode;
		if (((method === 'GET') || (method === 'HEAD'))
			&& app._cacheableStatusCodes[statusCode]
			&& !response.hasHeader('Cache-Control')) {
			response
				.header('Cache-Control', 'no-cache')
				.header('Expires', '0')
				.header('Pragma', 'no-cache');
		}

		// get response entities
		const entities = response.entities;

		// content type
		if (entities) {
			if (entities.length === 1) {
				let entity = entities[0];
				for (let h of Object.keys(entity.headers))
					response.header(h, entity.headers[h]);
			} else {
				response.header(
					'Content-Type',
					'multipart/mixed; boundary=' + this._boundary);
			}
		}

		// done if no entities or "HEAD" request
		if (!entities || (method === 'HEAD')) {
			this._httpResponse.writeHead(statusCode, response.headers);
			this._httpResponse.end();
			return;
		}		

		// buffer or stream?
		if (response.hasStreams) {

			// TODO:...

		} else { // no streams

			// create sequence of buffers to send in the response body
			const bufs = [];
			if (entities.length === 1) {

				bufs.push(this._getResponseEntityDataBuffer(entities[0]));

			} else { // multipart

				// create buffers with auxilliary elements
				const boundaryMid =
					new Buffer('--' + app._boundary + '\r\n', 'ascii');
				const boundaryEnd =
					new Buffer('--' + app._boundary + '--', 'ascii');
				const crlf = new Buffer('\r\n', 'ascii');

				// add payload parts
				entities.forEach((entity, ind) => {

					// part boundary
					bufs.push(boundaryMid);

					// part headers
					for (let h of Object.keys(entity.headers))
						partHead += util.headerCase(h) + ': '
							+ entity.headers[h] + '\r\n';
					partHead += '\r\n';
					bufs.push(new Buffer(partHead, 'ascii'));

					// part body
					bufs.push(this._getResponseEntityDataBuffer(entity));

					// part end
					bufs.push(crlf);
				});

				// end boundary of the multipart payload
				bufs.push(boundaryEnd);
			}

			// set response content length
			response.header(
				'Content-Length',
				bufs.reduce((totalLength, buf) => totalLength + buf.length, 0));

			// write response head
			this._httpResponse.writeHead(statusCode, response.headers);

			// write response body buffers
			const httpResponse = this._httpResponse;
			const numBufs = bufs.length;
			let curBufInd = 0;
			function writeHttpResponse() {
				while (curBufInd < numBufs) {
					if (!httpResponse.write(bufs[curBufInd++])) {
						httpResponse.once('drain', writeHttpResponse);
						return;
					}
				}
				httpResponse.end();
			}
			writeHttpResponse();

			// TODO: error and close events
		}
	}

	/**
	 * Get data buffer for the specified response entity invoking appropriate
	 * marshaller service if necessary.
	 *
	 * @private
	 * @param {HttpEntity} entity Response entity.
	 * @returns {external:Buffer} Buffer with the response entity data.
	 */
	_getResponseEntityDataBuffer(entity) {

		if (entity.data instanceof Buffer)
			return entity.data;

		const contentType = entity.headers['content-type'];
		const marshaller = this._app._services.get(
			'marshaller:' + contentType.split(/;\s*/)[0]);

		return marshaller.serialize(entity.data, contentType);
	}
}

module.exports = Application;
