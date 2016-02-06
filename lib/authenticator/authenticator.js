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
 * unauthenticated. The application can provide its own authenticator using the
 * {@link Application#service} method and registering an implementation of this
 * interface under service name "authenticator".
 *
 * @interface Authenticator
 */
/**
 * Tells if the authenticator relies on "credentialed" HTTP requests. For details
 * on the "credentialed" requests see
 * {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control_CORS#Requests_with_credentials|Requests With Credentials}
 * article in the MDN.
 *
 * @member {boolean} Authenticator#usesCredentialedRequests
 * @readonly
 */
/**
 * List of HTTP response headers used by the authenticator to send authentication
 * information back to the client. Listing the headers becomes relevant for the
 * {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control_CORS|CORS},
 * as these are the headers that become listed in the
 * "Access-Control-Expose-Headers" HTTP response header making them available to
 * the caller.
 *
 * @member {string[]} Authenticator#usedHeaders
 * @readonly
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
