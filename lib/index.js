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
 * Resource definition object. TODO: define more
 *
 * @typedef {Object} ResourceDefinition
 * @property {string} name Resource name.
 */

/**
 * Endpoint definition object. TODO: define more
 *
 * @typedef {Object} EndpointDefinition
 * @property {string} resource Resource name.
 */

/**
 * Logger is used internally by the framework components. It is also available to
 * the application.
 *
 * <p>All log methods take the message text as the first argument and an optional
 * list of message parameters inserted into the message using Node.js
 * {@link https://nodejs.org/dist/latest-v5.x/docs/api/util.html#util_util_format_format|util.format()}
 * function.
 *
 * @interface Logger
 */
/**
 * Log message at the <em>debug</em> level.
 *
 * @function Logger#debug
 * @param {string} msg The message.
 * @param {...*} [params] Message parameters.
 */
/**
 * Log message at the <em>info</em> level.
 *
 * @function Logger#info
 * @param {string} msg The message.
 * @param {...*} [params] Message parameters.
 */
/**
 * Log message at the <em>warning</em> level.
 *
 * @function Logger#warn
 * @param {string} msg The message.
 * @param {...*} [params] Message parameters.
 */
/**
 * Log message at the <em>error</em> level.
 *
 * @function Logger#error
 * @param {string} msg The message.
 * @param {...*} [params] Message parameters.
 */
/**
 * Tell if the <em>debug</em> level log is enabled. The method can be used before
 * calling {@link Logger#debug} in case when buidling the log message is
 * expensive.
 *
 * @function Logger#isDebugEnabled
 * @returns {boolean} <code>true</code> if <em>debug</em> level log is enabled.
 */

/**
 * The authenticator is a service used by the application to authenticate
 * incoming API calls. The authenticator service works tightly together with the
 * {@link ActorRegistry} service. The authenticator's task is to associate an
 * incoming application API call, provided in the form of an HTTP request, with
 * an actor provided by the {@link ActorRegistry}.
 *
 * <p>The default authenticator is a "no-op" authenticator that actually does not
 * use an {@link ActorRegistry}. It simply reports all incoming requests as
 * unauthenticated. The application can provide its own authenticator using the
 * {@link Application#service} method and registering an implementation of this
 * interface under service name "authenticator".
 *
 * @interface Authenticator
 */
/**
 * Tells if the authenticator relies on "credentialed" HTTP requests. For details
 * on the "credentialed" requests see
 * {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control_CORS#Requests_with_credentials|Requests With Credentials}
 * article in the MDN.
 *
 * @member {boolean} Authenticator#usesCredentialedRequests
 * @readonly
 */
/**
 * List of HTTP response headers used by the authenticator to send authentication
 * information back to the client. Listing the headers becomes relevant for the
 * {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control_CORS|CORS},
 * as these are the headers that become listed in the
 * "Access-Control-Expose-Headers" HTTP response header.
 *
 * @member {string[]} Authenticator#usedHeaders
 * @readonly
 */
/**
 * Authenticate incoming HTTP request.
 *
 * @function Authenticator#authenticate
 * @param {external:"http.IncomingMessage"} request The HTTP request.
 * @returns {Promise} Promise that resolves to the authenticated actor, or
 * <code>null</code> if request is unauthenticated or contains invalid
 * authentication information.
 */

/**
 * Actor registry.
 *
 * @interface ActorRegistry
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
 * // configure application resources and API endpoints
 * // ...
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
 * // configure application resources and API endpoints
 * // ...
 * ;
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
	_logger: new (require('./default-logger.js')),


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
	 * @returns {module:thymes2js} This object for chaining.
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
	 * @returns {module:thymes2js} This object for chaining.
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