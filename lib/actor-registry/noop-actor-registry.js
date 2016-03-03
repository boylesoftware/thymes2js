"use strict";

/**
 * {@link NoopActorRegistry} service provider.
 *
 * @implements {ServiceProvider}
 */
class NoopActorRegistryProvider {

	/**
	 * Returns instance of {@link NoopActorRegistry}.
	 */
	createService() {

		return new NoopActorRegistry();
	}
}

/**
 * Stub actor registry implementation that does not provide any actors. It is
 * only suitable for applications that provide completely public APIs that do
 * not require any actor authentication.
 *
 * <p>This is the default actor registry service pre-registered by the framework
 * and used unless the application registers a different implementation under
 * service name "actorRegistry".
 *
 * @implements {ActorRegistry}
 */
class NoopActorRegistry {

	/**
	 * Always returns a promise pre-resolved to <code>null</code>.
	 */
	lookup(authResult) {

		return Promise.resolve(null);
	}
}

module.exports = NoopActorRegistryProvider;
