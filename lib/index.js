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
 * one of more of the allowed HTTP methods.
 *
 * @function EndpointHandler#isPublic
 * @param {string} resourceUri Resource URI (path plus the query string).
 * @param {string[]} uriParams URI parameter values extracted from the resource
 * URI.
 * @returns {boolean} <code>true</code> if the resource is public.
 */

/**
 * Node.js URL module.
 *
 * @external Url
 * @see {@link https://nodejs.org/dist/latest-v5.x/docs/api/url.html}
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
 *     .on('request', app.respond.bind(app))
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
