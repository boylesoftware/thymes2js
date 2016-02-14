"use strict";

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
 * @returns {Promise.<Object>} Promise that resolves to the authenticated actor,
 * or <code>null</code> if request is unauthenticated or contains invalid
 * authentication information.
 */
/**
 * Add any authentication related information to the endpoint call response.
 *
 * @function Authenticator#addResponseAuthInfo
 * @param {Response} response The endpoint call response.
 * @param {?Object} actor Actor, on whose behalf the response is being sent, or
 * <code>null</code> if unauthenticated.
 * @param {external:Url} requestUrl Parsed original request URL.
 * @param {Object.<string,string>} httpRequestHeaders Original HTTP request
 * headers.
 */
