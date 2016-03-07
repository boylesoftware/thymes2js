"use strict";

/**
 * {@link BasicAuthenticator} service provider.
 *
 * @implements {ServiceProvider}
 */
class BasicAuthenticatorProvider {

	/**
	 * Create new provider.
	 */
	constructor() {

		this._realm = 'Web Service';
	}


	/**
	 * The authentication realm. The default is "Web Service". Overridden by
	 * "X2_AUTH_REALM" application configuration parameter.
	 *
	 * @type {string}
	 */
	get realm() {

		return this._realm;
	}
	set realm(v) {

		this._realm = v;
	}


	/**
	 * Returns "actorRegistry", "actorRegistryCache".
	 */
	get dependencies() {

		return [ 'actorRegistry', 'actorRegistryCache' ];
	}

	/**
	 * Returns instance of {@link BasicAuthenticator}.
	 */
	createService(runtime) {

		return new BasicAuthenticator(
			runtime,
			runtime.config('X2_AUTH_REALM') || this._realm);
	}
}

/**
 * Authenticator service implementation for standard HTTP "Basic" authentication
 * scheme. The {@link AuthenticationResult} object created by this authenticator
 * contains two properties:
 *
 * <dl>
 * <dt><code>actorId</code><dd>User login name, <code>string</code>.
 * <dt><code>credentials</code><dd>Clear text user password, <code>string</code>.
 * </dl>
 *
 * <p>The authentication realm can be configured using "X2_AUTH_REALM"
 * application configuration parameter. The default is "Web Service".
 *
 * <p>This is the default authenticator service used unless the application
 * registers a different implementation under service name "authenticator". Note,
 * that by default {@link NoopActorRegistry} is used, which makes the
 * authenticator ineffective.
 *
 * @implements {Authenticator}
 *
 * @see {@link https://tools.ietf.org/html/rfc7617}
 */
class BasicAuthenticator {

	/**
	 * Create new service instance. Used only by the provider.
	 *
	 * @param {Runtime} runtime Application runtime.
	 * @param {string} realm The authentication realm.
	 */
	constructor(runtime, realm) {

		this._challenge = 'Basic realm="' + realm + '", charset="UTF-8"';

		this._actorRegistry = runtime.service('actorRegistry');
		if (typeof this._actorRegistry.validCredentials !== 'function')
			throw new Error(
				'Actor registry service does not provide validCredentials()'
					+ ' method required by the Basic authenticator.');
		this._actorRegistryCache = runtime.service('actorRegistryCache');
	}


	/*
	 * Perform authentication.
	 */
	authenticate(httpRequest, requestUrl) {

		// get and parse the authorization header
		const authHeader = httpRequest.headers['authorization'];
		const data = (
			authHeader
				&& /^\s*basic\s+([0-9a-z+/]+={0,2})\s*$/i.exec(authHeader));
		if (!data)
			return Promise.resolve({
				actor: null,
				challenge: this._challenge
			});

		// decode the authorization header
		const dataPlain = (new Buffer(data[1], 'base64')).toString('utf8');
		const colInd = dataPlain.indexOf(':');
		if ((colInd <= 0) || (colInd >= dataPlain.length - 1))
			return Promise.resolve({
				actor: null,
				challenge: this._challenge
			});

		// create incomplete authentication result object
		const authResult = {
			actorId: dataPlain.substring(0, colInd),
			credentials: dataPlain.substring(colInd + 1)
		};

		// perform lookup and return result promise
		return new Promise((resolve, reject) => {
			this._actorRegistryCache.lookup(authResult).then(
				actor => {

					authResult.actor = actor;
					if (actor === null) {
						authResult.challenge = this._challenge;
					} else if (!this._actorRegistry.validCredentials(
						actor, authResult)) {
						authResult.actor = null;
						authResult.challenge = this._challenge;
					}

					resolve(authResult);
				},
				err => {

					if (err.code === 'server_error')
						return reject(err);

					authResult.actor = null;
					authResult.challenge = this._challenge;

					resolve(authResult);
				}
			);
		});
	}

	/**
	 * Does nothing.
	 */
	addResponseAuthInfo(response, actor, requestUrl, httpRequestHeaders) {

		// nothing
	}
}

module.exports = BasicAuthenticatorProvider;
