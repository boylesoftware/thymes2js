"use strict";

const Application = require('./application.js');

/**
 * Application configuration access function. The function is used throughout the
 * framework to access the configuration parameters. Various modules use
 * different configuration parameter names that are specific to them.
 *
 * <p>The default function reads configuration from the process environment using
 * <code>process.env</code> provided by Node.js. Application can redefine and use
 * its own configuration access function by providing it to
 * {@link module:thymes2js.config} before creating the application object.
 *
 * @callback ConfigFunction
 * @param {string} name Configuration parameter name.
 * @returns {string} The configuration parameter value, or <code>undefined</code>
 * if no such parameter is configured.
 */

/**
 * Resource definition object.
 *
 * @typedef {Object} ResourceDefinition
 * @property {string} name Resource name.
 */
// TODO: cacheability: sensitive (no-store), nocache (no-cache - do we need it?), default (max-age=0, must-reval), private+ttl, public+ttl

/**
 * Endpoint definition object.
 *
 * @typedef {Object} EndpointDefinition
 * @property {string} resource Resource name.
 */

/**
 * Common interface for various components that participate in HTTP request
 * processing and use HTTP request and response headers for their operation.
 *
 * <p>Note, that if a handler uses some request headers that determine its
 * influence on the response, it must consider adding those headers to the
 * response's "Vary" header.
 *
 * @interface HttpHeadersHandler
 */
/**
 * List of HTTP response headers used by the handler to communicate back to the
 * client. The listing becomes relevant for the
 * {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control_CORS|CORS},
 * as these are the headers that become listed in the
 * "Access-Control-Expose-Headers" HTTP response header making them available to
 * the caller.
 *
 * <p>Note, that according to the CORS specification, there is no need to list so
 * called <em>simple headers</em>, which are:
 *
 * <ul>
 * <li>Cache-Control
 * <li>Content-Language
 * <li>Content-Type
 * <li>Expires
 * <li>Last-Modified
 * <li>Pragma
 * </ul>
 *
 * <p>The property can be also <code>undefined</code> or <code>null</code> if no
 * headers need to be explicitely exposed.
 *
 * @member {string[]} HttpHeadersHandler#exposedResponseHeaders
 * @readonly
 */

/**
 * HTTP entity, which is the entity body plus a set of headers. The entity body
 * can be represented by an object, which is serialized by the framework using
 * the appropriate {@link Marshaller} implementation, by a
 * {@link external:Buffer} or by a {@link external:"stream.Readable"}.
 *
 * @typedef {Object} HttpEntity
 * @property {Object|external:Buffer|external:"stream.Readable"} data The entity
 * data.
 * @property {Object.<string,string>} [headers] The headers. The header names are
 * always all lower-case.
 */

/**
 * Object validation function. The function is used, for example, to validate
 * incoming request entities after parsing them as objects. Besides validation,
 * the function may make changes to the object (for example, some sort of
 * normalization or filling absent properties with defaults, etc.).
 *
 * <p>When the function is used in a chain, it may return <code>null</code> to
 * indicate that it has encountered an error, after which continueing validation
 * has no purpose.
 *
 * @callback ValidationFunction
 * @param {Object} obj Object to validate.
 * @param {ValidationErrors} errors Validation errors accumulator.
 * @returns {Object} The validated object.
 */

/**
 * Endpoint handler.
 *
 * @interface EndpointHandler
 * @augments HttpHeadersHandler
 */
/**
 * Get HTTP methods allowed for the resource handled by the handler.
 *
 * @function EndpointHandler#getAllowedMethods
 * @param {string} resourceUri Resource URI (path plus the query string).
 * @param {string[]} uriParams URI parameter values extracted from the resource
 * URI.
 * @returns {Set.<string>} Allowed methods (all upper-case). The handler does not
 * need to report methods "HEAD" and "OPTIONS". "HEAD" is allowed automatically
 * if the resource allows "GET" and "OPTIONS" is always allowed.
 */
/**
 * Tell if the resource handled by the handler is a <em>public</em> resource. A
 * public resource is such a resource that allows unauthenticated access using
 * one or more of the allowed HTTP methods.
 *
 * @function EndpointHandler#isPublic
 * @param {string} resourceUri Resource URI (path plus the query string).
 * @param {string[]} uriParams URI parameter values extracted from the resource
 * URI.
 * @returns {boolean} <code>true</code> if the resource is public.
 */
/**
 * Tell if the specified actor (if authenticated) has sufficient permissions to
 * make the specified call.
 *
 * @function EndpointHandler#isAllowed
 * @param {string} method HTTP method.
 * @param {string} resourceUri Resource URI (path plus the query string).
 * @param {string[]} uriParams URI parameter values extracted from the resource
 * URI.
 * @param {?Object} actor Actor making the call, or <code>null</code> if
 * unauthenticated.
 */
/**
 * Get validation function for the object expected in the described request's
 * entity. The method is optional and if not present in a handler, the handler
 * does not expect any payload in any of the requests that it handles.
 *
 * <p>The validation function is called by the framework immediately after the
 * request entity is parsed into an object and before the handler is called. This
 * is the soonest the incoming entity can be examined and, if invalid, rejected
 * by the handler. If the validation function reports errors, the call processing
 * is aborted, the handler is not called, and an HTTP 400 (Bad Request) response
 * is sent back to the caller with the validation errors object included in the
 * response body.
 *
 * <p>Note, that for multipart requests, the request entity is only the first
 * part in the request payload.
 *
 * @function EndpointHandler#getRequestEntityValidator
 * @param {string} method HTTP method.
 * @param {string} resourceUri Resource URI (path plus the query string).
 * @param {string[]} uriParams URI parameter values extracted from the resource
 * URI.
 * @returns {ValidationFunction} Validation function for the incoming request
 * entity, or <code>null</code> if the handler does not expect a request entity
 * with the described request.
 */
//...
/**
 * Handle a call.
 *
 * @function EndpointHandler#handleCall
 * @param {EndpointCallContext} ctx Endpoint call context.
 * @returns {EndpointCallResponse|Object|Promise.<EndpointCallResponse|Object>}
 * Call response or a promise of it. If resolves to an object, an HTTP 200 (OK)
 * response is sent with the object in the response body serialized as JSON. If
 * resolves to <code>null</code>, an HTTP 204 (No Content) is sent. The promise
 * can be rejected with an {@link external:Error} object, which will result in an
 * HTTP 500 (Internal Server Error) response.
 */

/**
 * Service provider. Service providers are factories for services. When a service
 * is registered in the application, its provider factory is associated with the
 * service name. The factory is then used to create the service instance during
 * the application initialization.
 *
 * <p>The services may have an optional method called <code>shutdown</code>,
 * which is called by the framework during application graceful shutdown. The
 * <code>shutdown</code> methods are called in the reverse service initialization
 * order.
 *
 * @interface ServiceProvider
 */
/**
 * Optional list of service names, on which the service provided by this provider
 * depends. The framework will make sure that those services are instantiated
 * before this service. Circular dependencies are not allowed. If service
 * provider does not have this property, the service is assumed to be independent
 * of any other service.
 *
 * @member {string[]} ServiceProvider#dependencies
 * @readonly
 */
/**
 * Optional function called before the application starts instantiating services,
 * but after all service providers are registred. This function allows the
 * service provider configure other registred service providers before they are
 * used to create their corresponding service instances.
 *
 * <p>A service provider does not have to have this function.
 *
 * @function ServiceProvider#configure
 * @param {ConfigFunction} configFn Application configuration access function.
 * @param {Logger} logger The logger.
 * @param {Map.<string,ServiceProvider>} serviceProviders All registered service
 * providers. The service provider must not make changes to this map.
 */
/**
 * Create service instance. The method is called once during the application
 * initialization. The framework makes sure that all services, on which the
 * service provided by this provider depends are instantiated first. Those
 * services are available in the {@link Runtime} instance passed into this
 * method.
 *
 * @function ServiceProvider#createService
 * @param {Runtime} runtime Application runtime.
 * @returns {*} The service instance.
 */

/**
 * Node.js <code>Error</code> object.
 *
 * @external Error
 * @see {@link https://nodejs.org/api/errors.html#errors_class_error}
 */
/**
 * Parsed URL object provided by Node.js "URL" module.
 *
 * @external Url
 * @see {@link https://nodejs.org/dist/latest-v5.x/docs/api/url.html}
 */
/**
 * Node.js <code>Buffer</code> object.
 *
 * @external Buffer
 * @see {@link https://nodejs.org/dist/latest-v5.x/docs/api/buffer.html}
 */
/**
 * Node.js <code>Readable</code> stream object.
 *
 * @external "stream.Readable"
 * @see {@link https://nodejs.org/dist/latest-v5.x/docs/api/stream.html#stream_class_stream_readable}
 */
/**
 * Node.js socket object.
 *
 * @external "net.Socket"
 * @see {@link https://nodejs.org/dist/latest-v5.x/docs/api/net.html#net_class_net_socket}
 */
/**
 * Node.js HTTP server.
 *
 * @external "http.Server"
 * @see {@link https://nodejs.org/dist/latest-v5.x/docs/api/http.html#http_class_http_server}
 */
/**
 * Node.js HTTP request.
 *
 * @external "http.IncomingMessage"
 * @see {@link https://nodejs.org/dist/latest-v5.x/docs/api/http.html#http_class_http_incomingmessage}
 */
/**
 * Node.js HTTP response.
 *
 * @external "http.ServerResponse"
 * @see {@link https://nodejs.org/dist/latest-v5.x/docs/api/http.html#http_class_http_serverresponse}
 */

/**
 * Top framework module. The object provided by the module acts as a factory for
 * the application object, which does the job of responding to the application
 * API calls. The application object is created using the
 * {@link module:thymes2js.createApplication} function.
 *
 * @module thymes2js
 *
 * @example <caption>Simplest usage example:</caption>
 * const http = require('http');
 * const x2 = require('thymes2js');
 *
 * const app = x2.createApplication()
 *     // configure application resources and API endpoints
 *     // ...
 * ;
 *
 * http.createServer((request, response) => {
 *     app.respond(request, response);
 * }).listen(8124);
 *
 * @example <caption>More comprehensive real-life example:</caption>
 * const http = require('http');
 * const x2 = require('thymes2js');
 *
 * const app = x2.createApplication()
 *     // configure application resources and API endpoints
 *     // ...
 *     .init();
 *
 * const server = http.createServer()
 *     .setTimeout(5000, app.onTimeout.bind(app))
 *     .on('request', app.respond.bind(app))
 *     .on('checkContinue', app.respond.bind(app))
 *     .on('close', app.shutdown.bind(app))
 *     .listen(process.env['HTTP_PORT'])
 * ;
 *
 * function terminate(signalNum) {
 *     server.close(() => {
 *         process.exit(128 + signalNum);
 *     });
 * }
 * process.on('SIGHUP', () => { terminate(1); });
 * process.on('SIGINT', () => { terminate(2); });
 * process.on('SIGTERM', () => { terminate(15); });
 */
module.exports = {

	/**
	 * Configuration access function.
	 *
	 * @private
	 * @member {ConfigFunction}
	 */
	_configFn: function(name) { return process.env[name]; },

	/**
	 * Logger.
	 *
	 * @private
	 * @member {Logger}
	 */
	_logger: new (require('./logger/default-logger.js')),


	/**
	 * Provide configuration access function. Must be called before the
	 * application is created using the
	 * {@link module:thymes2js.createApplication} function.
	 *
	 * <p>The default configuration access function reads configuration
	 * parameters from the process environment, as if configured like this:
	 *
	 * <pre><code>x2.config(name => process.env[name]);</code></pre>
	 *
	 * @param {ConfigFunction} configFn Application configuration access
	 * function.
	 * @returns This object for chaining.
	 */
	config(configFn) {

		this._configFn = configFn;

		return this;
	},

	/**
	 * Provide logger for the application and the framework components. Must be
	 * called before the application is created using the
	 * {@link module:thymes2js.createApplication} function.
	 *
	 * <p>The logger is used by the framework components to log its operation.
	 * The default logger, unless overridden using this function, uses debug log
	 * provided by Node.js via the <code>util.debuglog('x2')</code> function.
	 * That way, the framework debug logging can be enabled by including "x2" in
	 * the <code>NODE_DEBUG</code> environment variable. The <em>info</em>,
	 * <em>warning</em> and <em>error</em> level messages are by default logged
	 * using <code>console.info()</code>, <code>console.warn()</code> and
	 * <code>console.error()</code> functions respectively.
	 *
	 * @param {Logger} logger Logger to use.
	 * @returns This object for chaining.
	 */
	logger(logger) {

		this._logger = logger;

		return this;
	},

	/**
	 * Create application object.
	 *
	 * @returns {Application} The application object.
	 */
	createApplication() {

		return new Application(this._configFn, this._logger);
	}
};
