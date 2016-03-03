"use strict";

/**
 * Default header value handler.
 *
 * <p>When value is set, this handler simply replaces any existing value with the
 * provided on without any processing besides converting it to a string if
 * necessary. If the provided value is an instance of <code>Date</code>, the
 * value is automatically formatted according to the date HTTP header format. The
 * initial value is an empty string.
 *
 * <p>If no custom handler is registred for a header, this handler is used.
 *
 * @implements {HeaderValueHandler}
 */
class DefaultHeaderValueHandler {

	value(v) {

		if (v === undefined)
			return (this._value || '');

		this._value = (v instanceof Date ? v.toUTCString() : String(v));
	}
}

module.exports = DefaultHeaderValueHandler;
