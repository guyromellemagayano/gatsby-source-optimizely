import { camelCase, isEmpty, join, kebabCase, snakeCase, startCase, toArray, toLower, toNumber, toUpper, upperFirst } from "lodash";

/**
 * @description Convert string to lowercase
 * @param {String} e
 * @returns {String} Lowercase string
 */
export const convertStringToLowercase = (e) => (!isEmpty(e) ? toLower(e) : e);

/**
 * @description Convert string to uppercase
 * @param {String} e
 * @returns {String} Uppercase string
 */
export const convertStringToUppercase = (e) => (!isEmpty(e) ? toUpper(e) : e);

/**
 * @description Convert string to title case
 * @param {String} e
 * @returns {String} Title case string
 */
export const convertStringToTitleCase = (e) => (!isEmpty(e) ? startCase(camelCase(e)) : e);

/**
 * @description Convert string to camel case
 * @param {String} e
 * @returns {String} Camel case string
 */
export const convertStringToCamelCase = (e) => (!isEmpty(e) ? camelCase(e) : e);

/**
 * @description Convert string to snake case
 * @param {String} e
 * @returns {String} Snake case string
 */
export const convertStringToSnakeCase = (e) => (!isEmpty(e) ? snakeCase(e) : e);

/**
 * @description Convert string to kebab case
 * @param {String} e
 * @returns {String} Kebab case string
 */
export const convertStringToKebabCase = (e) => (!isEmpty(e) ? kebabCase(e) : e);

/**
 * @description Convert string to constant case
 * @param {String} e
 * @returns {String} Constant case string
 */
export const convertStringToConstantCase = (e) => (!isEmpty(e) ? toUpper(e).replace(/ /g, "_") : e);

/**
 * @description Convert string to sentence case
 * @param {String} e
 * @returns {String} Sentence case string
 */
export const convertStringToSentenceCase = (e) => (!isEmpty(e) ? upperFirst(toLower(e)) : e);

/**
 * @description Convert string to number
 * @param {String} e
 * @returns {number} Number
 */
export const convertStringToNumber = (e) => (!isEmpty(e) ? toNumber(e) : e);

/**
 * @description Convert string to boolean
 * @param {String} e
 * @returns {boolean} Boolean
 */
export const convertStringToBoolean = (e) => (!isEmpty(e) ? e === "true" : e);

/**
 * @description Convert string to array
 * @param {String} e
 * @returns {array} Array
 */
export const convertStringToArray = (e) => (!isEmpty(e) ? toArray(e) : e);

/**
 * @description Convert string to object
 * @param {String} e
 * @returns {object} Object
 */
export const convertStringToObject = (e) => (!isEmpty(e) ? JSON.parse(e) : e);

/**
 * @description Convert object to string
 * @param {object} e
 * @returns {String} String
 */
export const convertObjectToString = (e) => (!isEmpty(e) ? JSON.stringify(e) : e);

/**
 * @description Convert array to string
 * @param {array} e
 * @returns {String} String
 */
export const convertArrayToString = (e) => (!isEmpty(e) ? join(e, " ") : e);

/**
 * @description Convert number to string
 * @param {number} e
 * @returns {String} String
 */
export const convertNumberToString = (e) => (!isEmpty(e) ? toString(e) : e);
