"use strict";

/**
 * Common utilities module.
 *
 * @module util
 */
module.exports = {

	/**
	 * Normalize HTTP response header name to the form such as
	 * "Some-Custom-Header".
	 *
	 * @param {string} name Header name to normalize.
	 * @returns {string} Normalized header name.
	 */
	headerCase(name) {

		return name.toLowerCase().replace(
				/\b[a-z]/g, match => match.toUpperCase());
	}
};
