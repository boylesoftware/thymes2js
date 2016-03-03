"use strict";

/**
 * Authentication result object. The object is returned by the
 * {@link Authenticator} service as a result of a request authentication and
 * contains parsed pieces of the authentication information extracted from the
 * HTTP request and ultimately the actor account record provided by the
 * {@link ActorRegistry} service.
 * 
 * <p>Depending on the implementation of the {@link Authenticator} service,
 * different implementation-specific properties can be used on the authentication
 * result object besides the standard properties described below. Since the actor
 * registry service uses the authentication result object to lookup the actor
 * account, the registry service implementation must be aware of those
 * properties even though certain conventions exist to make the interoperation
 * between the authenticator and the actor registry more generic. For example, in
 * simple cases, the authenticator sets a property called <code>actorId</code> in
 * the authentication result object that is used by the registry to lookup the
 * actor account.
 *
 * @typedef {Object} AuthenticationResult
 * @property {?Object} actor Authenticated actor, or <code>null</code> if could
 * not authenticate because the request did not contain any authentication
 * information or the authentication information is invalid or expired. If could
 * not authenticate, the result object will have <code>challenge</code> property.
 * @property {string} [challenge] If could not authenticate, the challenge to
 * send back to the caller in the "WWW-Authenticate" HTTP response header.
 */

/**
 * The authenticator is a service used by the application to authenticate
 * incoming API calls. The authenticator service works tightly together with the
 * {@link ActorRegistry} service. The authenticator's task is to associate an
 * incoming application API call, provided in the form of an HTTP request, with
 * an actor provided by the {@link ActorRegistry}.
 *
 * <p>The service is registered under name "authenticator". By default,
 * {@link BasicAuthenticator} is pre-registered by the framework.
 *
 * @interface Authenticator
 * @augments HttpHeadersHandler
 */
/**
 * Authenticate incoming HTTP request.
 *
 * @function Authenticator#authenticate
 * @param {external:"http.IncomingMessage"} httpRequest The HTTP request.
 * @param {external:Url} requestUrl Parsed HTTP request URL.
 * @returns {Promise.<AuthenticationResult>} Promise that resolves to the
 * authentication result. If an unexpected error happens in the
 * authenticator, the promise is rejected with an {@link external:Error} object.
 * Normally, rejection of the promise will result in a 500 error sent back to the
 * caller.
 */
/**
 * Add any authentication related information to the endpoint call response.
 *
 * @function Authenticator#addResponseAuthInfo
 * @param {Response} response The endpoint call response.
 * @param {AuthenticationResult} authResult Authentication result object
 * originally returned by the {@link Authenticator#authenticate} method.
 * @param {?Object} responseActor Actor, to whom the response is addressed, or
 * <code>null</code> if unauthenticated. Usually, it is the same actor
 * that is in the {@link AuthenticationResult} object, but not always.
 * @param {external:Url} requestUrl Parsed original request URL.
 * @param {Object.<string,string>} httpRequestHeaders Original HTTP request
 * headers.
 */
