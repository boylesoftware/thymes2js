"use strict";

/**
 * Application runtime. A single <code>Runtime</code> object is created per
 * initialized {@link Application} and provides the framework's API to various
 * application components outside the context of an application endpoint call.
 */
class Runtime {

	/**
	 * Create new application runtime. The constructor is not used directly by
	 * the application. The runtime instance is created automatically by the
	 * {@link Application} upon its initialization.
	 *
	 * @param {ConfigFunction} configFn Application configuration access
	 * function.
	 * @param {Logger} logger The logger.
	 * @param {Map.<string,Object>} services Reference to the services map.
	 */
	constructor(configFn, logger, services) {

		this._configFn = configFn;
		this._logger = logger;
		this._services = services;
	}


	/**
	 * Get application configuration parameter.
	 *
	 * @param {string} name Configuration parameter name.
	 * @returns {string} Configuration parameter value, or <code>undefined</code>
	 * if no such parameter.
	 */
	config(name) {

		return this._configFn(name);
	}

	/**
	 * The logger.
	 *
	 * @type {Logger}
	 * @readonly
	 */
	get logger() {

		return this._logger;
	}

	/**
	 * Get service.
	 *
	 * @param {string} name Service registration name.
	 * @returns {*} The service instance.
	 * @throws {Error} No such service registered.
	 */
	service(name) {

		const service = this._services.get(name);

		if (service === undefined)
			throw new Error('Unknown service "' + name + '".');

		return service;
	}
}

module.exports = Runtime;
