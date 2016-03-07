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

		// TODO: optional charset in the content type

		return new Buffer(JSON.stringify(obj));
	}

	deserialize(data, contentType) {

		// TODO: optional charset in the content type

		return JSON.parse(data.toString());
	}
}

module.exports = JsonMarshallerProvider;
