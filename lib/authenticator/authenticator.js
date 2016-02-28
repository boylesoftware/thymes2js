"use strict";

/**
 * Authentication result object.
 *
 * @typedef {Object} AuthenticationResult
 * @property {?Object} actor Authenticated actor, or <code>null</code> if could
 * not authenticate because the request did not contain any authentication
 * information of the authentication information is invalid or expired. If could
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
 * <p>The default authenticator is a "no-op" authenticator that actually does not
 * use an {@link ActorRegistry}. It simply reports all incoming requests as
 * unauthenticated. The application, unless all of its endpoints are public, can
 * usually registers its own authenticator, which is an implementation of this
 * interface registered under "authenticator" service name.
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
 * @param {?Object} requestActor Actor that made the request, or
 * <code>null</code> if the request was unauthenticated.
 * @param {?Object} responseActor Actor, on whose behalf the response is being
 * sent, or <code>null</code> if unauthenticated.
 * @param {external:Url} requestUrl Parsed original request URL.
 * @param {Object.<string,string>} httpRequestHeaders Original HTTP request
 * headers.
 */
