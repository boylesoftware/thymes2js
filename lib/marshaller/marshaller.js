"use strict";

/**
 * Marshaller is a service used to parse HTTP request and serialize HTTP response
 * payloads. The services are registered under "marshaller:content-type" names,
 * where "content-type" is the content type handled by the marshaller. For
 * example, by default, the framework pre-registers a JSON marshaller under name
 * "marshaller:application/json".
 *
 * @interface Marshaller
 */
/**
 * Serialize the specified object for sending it in an HTTP response.
 *
 * @function Marshaller#serialize
 * @param {Object} obj The object to serialize.
 * @param {string} contentType Content type (may have optional charset argument).
 * @returns {external:Buffer} Serialized data.
 */
