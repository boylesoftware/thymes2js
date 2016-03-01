"use strict";

/**
 * {@link JsonMarshaller} service provider.
 *
 * @implements {ServiceProvider}
 */
class JsonMarshallerProvider {

	createService() {

		return new JsonMarshaller();
	}
}

/**
 * Marshaller implementation that handles JSON content. This marshaller is
 * automatically preregistered by the framework under name
 * "marshaller:application/json".
 *
 * @implements {Marshaller}
 */
class JsonMarshaller {

	serialize(obj, contentType) {

		return new Buffer(JSON.stringify(obj));
	}
}

module.exports = JsonMarshallerProvider;
