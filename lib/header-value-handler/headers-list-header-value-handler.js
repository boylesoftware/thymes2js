"use strict";

const HeadersSet = require('../headers-set.js');

/**
 * Handler for headers, whose value is a list of header names.
 *
 * <p>When value is set, it is converted to a string, if necessary, and then
 * normalized using {@link HeadersSet.headerCase}. If the value is not already in
 * the list, it is added to the list after a comma. The provided value can also
 * be a comma-separated list, in which case each element is processed
 * individually.
 *
 * <p>This handler is automatically registered in the application for the
 * following headers:
 *
 * <ul>
 * <li>Vary
 * <li>Access-Control-Allow-Headers
 * <li>Access-Control-Expose-Headers
 * </ul>
 *
 * @implements {HeaderValueHandler}
 */
class HeadersListHeaderValueHandler {

	value(v) {

		if (v === undefined)
			return (this._value ? Array.from(this._value).join(', ') : '');

		if (!this._value)
			this._value = new Set();
		String(v).trim().split(/\s*,\s*/).forEach(element => {
			this._value.add(HeadersSet.headerCase(element))
		});
	}
}

module.exports = HeadersListHeaderValueHandler;
