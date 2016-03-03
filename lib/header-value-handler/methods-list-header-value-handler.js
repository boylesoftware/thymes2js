"use strict";

/**
 * Handler for headers, whose value is a list of HTTP methods.
 *
 * <p>When value is set, it is converted to a string, if necessary, and then made
 * all upper-case. If the value is not already in the list, it is added to the
 * list after a comma. The provided value can also be a comma-separated list, in
 * which case each element is processed individually.
 *
 * <p> This handler is automatically registered in the application for the
 * following headers:
 *
 * <ul>
 * <li>Allow
 * <li>Access-Control-Allow-Methods
 * </ul>
 *
 * @implements {HeaderValueHandler}
 */
class MethodsListHeaderValueHandler {

	value(v) {

		if (v === undefined)
			return (this._value ? Array.from(this._value).join(', ') : '');

		if (!this._value)
			this._value = new Set();
		String(v).trim().split(/\s*,\s*/).forEach(element => {
			this._value.add(element.toUpperCase())
		});
	}
}

module.exports = MethodsListHeaderValueHandler;
