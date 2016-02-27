"use strict";

/**
 * Set of HTTP response headers.
 *
 * <p>When {@link HeadersSet#header} method is invoked to associate a value with
 * an HTTP header, the approriate header value handler is used (looked up in the
 * application using {@link Application#headerValueHandler} method). The handler
 * determines how the provided value is normalized and combined with already
 * existing value (if any). The default handler used for the majority of headers
 * simply replaces existing value, if any, with the new value without performing
 * any value normalization (see {@link DefaultHeaderValueHandler}). However, by
 * default, special handlers are registered in the application for certain
 * headers. For example, if the header is a comma-separated list of other headers
 * names (e.g. "Vary"), special handler {@link HeadersListHeaderValueHandler} is
 * used. If the header is a list of HTTP methods (e.g. "Allow"),
 * {@link MethodsListHeaderValueHandler} is used. Custom handlers can be
 * registred during the application initialization as well.
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
	 * Create new, empty headers set.
	 *
	 * @param {Application} app The application.
	 */
	constructor(app) {

		this._app = app;

		this._headers = new Map();
	}


	/**
	 * Associate value with the specified header.
	 *
	 * @param {string} name HTTP response header name, case-insensitive.
	 * @param {*} value Value to associate. The value is processed and combined
	 * with any existing value by the registred header value handler. If the
	 * value is <code>null</code> or <code>undefined</code>, the header is
	 * removed from the set (the <code>keepExisting</code> argument is ignored).
	 * @param {boolean} [keepExisting=false] If the header is already present,
	 * do not do anything.
	 * @returns This object for chaining.
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
	 * Tell if the set already includes the specified header.
	 *
	 * @param {string} name HTTP response header name, case-insensitive.
	 * @returns {boolean} <code>true</code> if already includes the header.
	 */
	hasHeader(name) {

		return this._headers.has(name.toLowerCase());
	}

	/**
	 * The accumulated HTTP headers.
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
