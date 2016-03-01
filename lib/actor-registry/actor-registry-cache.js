"use strict";

/**
 * {@link ActorRegistryCache} service provider.
 *
 * @implements {ServiceProvider}
 */
class ActorRegistryCacheProvider {

	get dependencies() {

		return [ 'actor-registry' ];
	}

	createService(runtime) {

		return new ActorRegistryCache(runtime);
	}
}

class ActorRegistryCache {

	constructor(runtime) {

		this._actors = runtime.service('actors');
	}


	lookup(authResult) {

		//...
	}
}

module.exports = ActorRegistryCacheProvider;
