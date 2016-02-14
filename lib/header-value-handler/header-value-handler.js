"use strict";

/**
 * Header value handler interface.
 *
 * <p>The value handlers provide a single read-write property called
 * <code>value</code>. When the property is read, it returns the current header
 * value (always a <code>string</code>). When the property is set, the provided
 * value is processed by the handler (for example, if the value needs to be
 * somehow normalized) and either set as the header value or combined with any
 * existing value according to the handler implementation logic.
 *
 * @interface HeaderValueHandler
 */
/**
 * The header value.
 *
 * @member {string|*} HeaderValueHandler#value
 */
