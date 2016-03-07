"use strict";

/**
 * Object validation errors accumulator.
 */
class ValidationErrors {

	/**
	 * Create new empty errors object. This constructor is used internally by the
	 * framework.
	 *
	 * @param {Application} app The application.
	 */
	constructor(app) {

		this._app = app;
	}


	/**
	 * Add validation error.
	 *
	 * @param {string} propertyName Invalid property name (dot and square
	 * brackets notation). The application may reserve a special name for errors
	 * that are not associated with any particular property (e.g. "GLOBAL").
	 * @param {string} constraintType Violated constraint identifier.
	 * @param {Array.<*>} [violationParams] Optional violation parameters.
	 * @returns This object.
	 */
	add(propertyName, constraintType, violationParams) {

		// TODO:...

		return this;
	}

	/**
	 * Tells if there are any errors.
	 *
	 * @type {boolean}
	 * @readonly
	 */
	get hasErrors() {

		// TODO:...
		return false;
	}
}

module.exports = ValidationErrors;
