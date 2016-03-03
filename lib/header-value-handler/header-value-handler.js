"use strict";

/**
 * Header value handler interface.
 *
 * <p>The value handlers provide a single method called <code>value</code>. When
 * the method is called without an argument, it returns the current header value
 * (always a <code>string</code>). When the method is called with an argument,
 * the provided value is processed by the handler (for example, if the value
 * needs to be somehow normalized) and either set as the header value or combined
 * with any existing value according to the handler implementation logic.
 *
 * @interface HeaderValueHandler
 */
/**
 * Get header value.
 *
 * @function HeaderValueHandler#value
 * @returns {string} Header value.
 */
/**
 * Set/add header value.
 *
 * @function HeaderValueHandler#value
 * @param {*} value The value.
 */
