"use strict";

/**
 * Actor registry is a service that supplies the application with the actors.
 * 
 * <p>The framework uses term <em>actor</em> for the entity that makes an
 * authenticated call to the application API and to which the API response is
 * addressed. An actor can be a user, another application, etc. Because the actor
 * is not necessarily a human user, the framework does not use the term
 * <em>user</em> and instead utilizes a more generic term <em>actor</em>.
 *
 * <p>Note, that normally, the response is addressed to the same actor that made
 * the request, but not always: for example, the application may provide
 * endpoints for user login, identity switch, etc.
 *
 * <p>The actor registry service operates tightly together with the
 * {@link Authenticator} service and allows it to perform lookups of the actor
 * accounts by the authentication information provided by the caller in the HTTP
 * request. To perform a lookup, the authenticator calls the actor registry and
 * passes it an incomplete {@link AuthenticationResult} object that contains
 * parsed pieces of the authentication information extracted from the request,
 * but no <code>actor</code> property yet. Normally, the object will contain a
 * property called <code>actorId</code>. Using this id, the registry service
 * performs a lookup in its actor database. On the other hand, the authenticator
 * and the actor registry may be tightly coupled together and be aware of each
 * other's implementation and use some other data in the authentication result
 * object to interoperate.
 *
 * <p>Normally, authenticators do not call the actor registry directly when they
 * need to lookup an actor. Instead, they call the registry through the
 * short-term actor lookup cache service registred as "actorRegistryCache"
 * service. See {@link ActorRegistryCache}.
 *
 * <p>The service is registered under name "actorRegistry". By default,
 * {@link NoopActorRegistry} is pre-registered by the framework.
 *
 * @interface ActorRegistry
 */
/**
 * Perform actor lookup.
 *
 * @function ActorRegistry#lookup
 * @param {AuthenticationResult} authResult Incomplete authentication result
 * object provided by the authenticator.
 * @returns {Promise.<Object>} Promise that resolves to the actor account record.
 * If not matching actor found, the promise resolves to <code>null</code>. If an
 * error happens looking up the actor, the promise is rejected with an
 * {@link external:Error} object. The error object will have a <code>code</code>
 * property explaning the error to the authenticator. The following standard
 * error codes are defined:
 *
 * <dl>
 * <dt>invalid_request<dd>The information provided by the authenticator in the
 * authentication result object is invalid (missing, malformed data, etc.).
 * <dt>access_denied<dd>Given the authentication information, the actor registry
 * disallowed access to the actor database and therefore did not perform the
 * lookup.
 * <dt>server_error<dd>An unexpected error happened. Normally, will result in a
 * 500 error sent back to the caller.
 * </dl>
 */
/**
 * For the specified actor account record, get the actor id that uniquely
 * identifies the actor within the application. The simplest implementation of
 * this method returns the <code>actorId</code> property of the specified actor
 * account object.
 *
 * <p>In particular, this id is used as a key in the {@link ActorRegistryCache}
 * service implementation.
 *
 * @function ActorRegistry#getActorId
 * @param {Object} actor The actor.
 * @returns {string} Actor id.
 */
/**
 * Optional method that checks validity of credentials provided by the
 * authenticator in the authentication result object for the specified actor.
 *
 * <p>This method is only used by authenticators that need to perform credentials
 * check for every request. For example, an authenticator implementation for the
 * "Basic" HTTP authentication scheme needs to check that the password included
 * in the request's "Authentication" header matches the password on the actor
 * account record. Normally, authenticators that must check the credentials
 * include the credentials value in the authentication result object's
 * <code>credentials</code> property. The actor registry implementation must be
 * aware of the authenticator implementation and expect the credentials in a
 * certain format (plain password, digest, etc.).
 *
 * @function ActorRegistry#validCredentials
 * @param {Object} actor The actor.
 * @param {AuthenticationResult} authResult Authentication result object provided
 * by the authenticator.
 * @returns {boolean} <code>true</code> if the credentials in the specified
 * authentication result object are valid for the specified actor.
 */
