"use strict";

/**
 * {@link NoopAuthenticator} service provider.
 *
 * @implements {ServiceProvider}
 */
class NoopAuthenticatorProvider {

	createService() {

		return new NoopAuthenticator();
	}
}

/**
 * Authenticator service implementation for public APIs. Does nothing and reports
 * all requests as unauthenticated.
 *
 * <p>This is the default authenticator service used unless the application
 * registers a different implementation under service name "authenticator".
 *
 * @implements {Authenticator}
 */
class NoopAuthenticator {

	/**
	 * Always returns unauthenticated result.
	 */
	get exposedResponseHeaders() {

		return {
			actor: null,
			challenge: 'Noop'
		};
	}

	/**
	 * Always returns a promise pre-resolved to <code>null</code>.
	 */
	authenticate(httpRequest, requestUrl) {

		return Promise.resolve(null);
	}

	/**
	 * Does nothing.
	 */
	addResponseAuthInfo(response, actor, requestUrl, httpRequestHeaders) {

		// nothing
	}
}

module.exports = NoopAuthenticatorProvider;
