"use strict";

/**
 * Logger is used internally by the framework components. It is also available to
 * the application.
 *
 * <p>All log methods take the message text as the first argument and an optional
 * list of message parameters inserted into the message using Node.js
 * {@link https://nodejs.org/dist/latest-v5.x/docs/api/util.html#util_util_format_format|util.format()}
 * function.
 *
 * @interface Logger
 */
/**
 * Log message at the <em>debug</em> level.
 *
 * @function Logger#debug
 * @param {string} msg The message.
 * @param {...*} [params] Message parameters.
 */
/**
 * Log message at the <em>info</em> level.
 *
 * @function Logger#info
 * @param {string} msg The message.
 * @param {...*} [params] Message parameters.
 */
/**
 * Log message at the <em>warning</em> level.
 *
 * @function Logger#warn
 * @param {string} msg The message.
 * @param {...*} [params] Message parameters.
 */
/**
 * Log message at the <em>error</em> level.
 *
 * @function Logger#error
 * @param {string} msg The message.
 * @param {...*} [params] Message parameters.
 */
/**
 * Tell if the <em>debug</em> level log is enabled. The method can be used before
 * calling {@link Logger#debug} in case when buidling the log message is
 * expensive.
 *
 * @function Logger#isDebugEnabled
 * @returns {boolean} <code>true</code> if <em>debug</em> level log is enabled.
 */
