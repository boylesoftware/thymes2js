"use strict";

/**
 * Set of HTTP response headers.
 */
class HeadersSet {

	/**
	 * Normalize HTTP response header name to the form such as
	 * "Some-Custom-Header".
	 *
	 * @param {string} name Header name to normalize.
	 * @returns {string} Normalized header name.
	 */
	static headerCase(name) {

		return name.toLowerCase().replace(
				/\b[a-z]/g, match => match.toUpperCase());
	}


	/**
	 * Create new, empty accumulator.
	 *
	 * @param {Application} app The application.
	 */
	constructor(app) {

		this._app = app;

		this._headers = new Map();
	}


	/**
	 * Set/add header value.
	 *
	 * @param {string} name HTTP response header name, case-insensitive.
	 * @param {*} value Value to add or set. The value is processed and used for
	 * the header value according to the registred header value handler. If the
	 * value is <code>null</code> or <code>undefined</code>, the header is
	 * removed from the set (the <code>keepExisting</code> argument is ignored).
	 * @param {boolean} [keepExisting=false] If the header is already present,
	 * do not do anything.
	 * @returns {HeadersSet} This object for chaining.
	 */
	header(name, value, keepExisting) {

		const nameLC = name.toLowerCase();

		if (value === undefined || value === null) {
			this._headers.delete(nameLC);
		} else {
			let header = this._headers.get(nameLC);
			if (!header)
				this._headers.set(
					nameLC, header = this._app.headerValueHandler(nameLC));
			else if (keepExisting)
				return this;
			header.value(value);
		}

		return this;
	}

	/**
	 * Accumulated headers.
	 *
	 * @type {Object.<string,string>}
	 * @readonly
	 */
	get headers() {

		const res = {};
		this._headers.forEach((valueHandler, name) => {
			res[HeadersSet.headerCase(name)] = valueHandler.value;
		});

		return res;
	}
}

module.exports = HeadersSet;
