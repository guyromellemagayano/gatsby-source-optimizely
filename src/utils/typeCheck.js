import { isArray, isBoolean, isFinite, isNull, isPlainObject, isString, isUndefined, size } from "lodash";

/**
 * @description Check if the value is not null or undefined
 * @param {Object|Array|String|Number} e
 * @returns {Boolean} True if the value is not null or undefined
 */
export const isNotNullOrUndefined = (e) => !isNull(e) && !isUndefined(e);

/**
 * @description Check if the given value is a object and not null or undefined
 * @param {Object} e
 * @returns {Boolean} True if the given value is a object and not null or undefined
 */
export const isObjectType = (e) => isNotNullOrUndefined(e) && isPlainObject(e);

/**
 * @description Check if the given value is a array and not null or undefined
 * @param {Array} e
 * @returns {Boolean} True if the given value is a array and not null or undefined
 */
export const isArrayType = (e) => isNotNullOrUndefined(e) && isArray(e);

/**
 * @description Check if the given value is a string and not null or undefined
 * @param {String} e
 * @returns {Boolean} True if the given value is a string and not null or undefined
 */
export const isStringType = (e) => isNotNullOrUndefined(e) && isString(e);

/**
 * @description Check if the given value is a number and not null or undefined
 * @param {Number} e
 * @returns {Boolean} True if the given value is a number and not null or undefined
 */
export const isNumberType = (e) => isNotNullOrUndefined(e) && isFinite(e);

/**
 * @description Check if the given value is a boolean and not null or undefined
 * @param {Boolean} e
 * @returns {Boolean} True if the given value is a boolean and not null or undefined
 */
export const isBooleanType = (e) => isNotNullOrUndefined(e) && isBoolean(e);

/**
 * @description Check if the given valid value is empty
 * @param {Object|Array|String|Number} e
 * @returns {Boolean} True if the given valid value is empty
 */
export const isEmpty = (e) => {
	if (isStringType(e) || isArrayType(e) || isObjectType(e)) {
		return size(e) === 0;
	} else if (isNumberType(e)) {
		return e === 0;
	} else {
		return true;
	}
};
