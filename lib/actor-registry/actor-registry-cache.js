"use strict";

/**
 * {@link ActorRegistryCache} service provider.
 *
 * @implements {ServiceProvider}
 */
class ActorRegistryCacheProvider {

	/**
	 * Create new provider.
	 */
	constructor() {

		this._maxCached = 100;
		this._cacheTTL = 5;
	}


	/**
	 * Maximum number of cached actors. The default is 100. Overridden by
	 * "X2_ACTOR_CACHE_MAX" application configuration parameter. If zero or less,
	 * the cache is disabled.
	 *
	 * @type {number}
	 */
	get maxCached() {

		return this._maxCached;
	}
	set maxCached(v) {

		this._maxCached = v;
	}

	/**
	 * Number of seconds a cached actor remains usable. The default is 5 seconds.
	 * Overridden by "X2_ACTOR_CACHE_TTL" application configuration parameter. If
	 * zero or less, the cache is disabled.
	 *
	 * @type {number}
	 */
	get cacheTTL() {

		return this._cacheTTL;
	}
	set cacheTTL(v) {

		this._cacheTTL = v;
	}


	/**
	 * Returns "actor-registry".
	 */
	get dependencies() {

		return [ 'actor-registry' ];
	}

	createService(runtime) {

		return new ActorRegistryCache(
			runtime,
			Number(runtime.config('X2_ACTOR_CACHE_MAX')) || this._maxCached,
			Number(runtime.config('X2_ACTOR_CACHE_TTL')) || this._cacheTTL
		);
	}
}

/**
 * Actor registry cache service, which is a wrapper around the actor registry
 * service that provides short-term actor lookup results caching. The maximum
 * number of cached lookups is configured using the provider's property
 * <code>maxCached</code> and/or application configuration parameter
 * "X2_ACTOR_CACHE_MAX". The lookup expiration period in seconds is configured
 * using the provider's property <code>cacheTTL</code> and/or application
 * configuration parameter "X2_ACTOR_CACHE_TTL".
 */
class ActorRegistryCache {

	/**
	 * Create new service instance. Used only by the provider.
	 *
	 * @private
	 * @param {Runtime} runtime Application runtime.
	 * @param {number} maxCached Maximum number of cached lookups.
	 * @param {number} cacheTTL Cached lookup expiration period in seconds.
	 */
	constructor(runtime, maxCached, cacheTTL) {

		this._maxCached = maxCached;
		this._cacheTTLms = cacheTTL * 1000;
		this._disabled = ((maxCached <= 0) || (cacheTTL <= 0));

		this._logger = runtime.logger;
		this._actorRegistry = runtime.service('actor-registry');

		this._cache = new Map();
	}


	/**
	 * Perform actor lookup. If a previous lookup is cached and not expired, the
	 * cached actor is returned. If no fresh cached lookup, the method delegates
	 * to {@link ActorRegistry#lookup}.
	 *
	 * @param {AuthenticationResult} authResult Incomplete authentication result
	 * object provided by the authenticator.
	 * @returns {Promise.<Object>} Promise that resolves to the actor.
	 */
	lookup(authResult) {

		// check if caching is disabled
		if (this._disabled)
			return this._actorRegistry.lookup(authResult);

		// get cache key (aka actor id)
		const actorId = this._actorRegistry.getActorId(authResult);

		// get cached element
		let cached = this._cache.get(actorId);

		// check if has cached element and if it's stale or fresh
		const now = Date.now();
		let stale;
		if (!cached) {

			// no cached element, new one will be stale until resolved
			stale = true;

			// make room in the cache if necessary
			if (this._cache.size >= this._maxCached) {

				// remove stale resolved cached elements
				let oldestKey, oldestTS = now, numRemoved = 0;
				this._cache.forEach((v, k) => {
					if (v.resolved && ((now - v.timestamp) >= his._cacheTTLms)) {
						this._cache.delete(k);
						numRemoved++;
					} else if (v.resolved && (v.timestamp < oldestTS)) {
						oldestKey = k;
						oldestTS = v.timestamp;
					}
				});

				// could not remove any?
				if (numRemoved === 0) {

					// remove single oldest element
					if (oldestKey !== undefined) {
						this._cache.delete(oldestKey);
					} else { // no oldest element, don't cache
						this._logger.warn('ineffective actors cache');
						return this._actorRegistry.lookup(authResult);
					}
				}
			}

			// create new cached element and save it in the cache
			this._cache.set(actorId, cached = {});

		} else { // cached element exists, check if stale
			stale = (
				cached.resolved
				&& ((now - cached.timestamp) >= this._cacheTTLms)
			);
		}

		// perform lookup in the actor registry if stale
		if (stale) {
			cached.resolved = false;
			cached.actorPromise = this._actorRegistry.lookup(authResult).then(
				actor => {
					cached.resolved = true;
					cached.timestamp = Date.now();
					return actor;
				},
				err => {
					this._cache.delete(actorId);
					return Promise.reject(err);
				}
			);
		}

		// return the promise
		return cached.actorPromise;
	}
}

module.exports = ActorRegistryCacheProvider;
