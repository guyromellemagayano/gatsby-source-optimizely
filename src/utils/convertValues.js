/**
 * @description Convert string to lowercase
 * @param {String} e
 * @returns {String} Lowercase string
 */
export const convertStringToLowercase = (e) => (typeof e === "string" && e?.length > 0 && e?.length > 0 ? e.toLowerCase() : e);

/**
 * @description Convert string to uppercase
 * @param {String} e
 * @returns {String} Uppercase string
 */
export const convertStringToUppercase = (e) => (typeof e === "string" && e?.length > 0 ? e.toUpperCase() : e);

/**
 * @description Convert string to title case
 * @param {String} e
 * @returns {String} Title case string
 */
export const convertStringToTitleCase = (e) =>
	typeof e === "string" && e?.length > 0
		? (e = e
				.toLowerCase()
				.split(" ")
				.map((e) => e.charAt(0).toUpperCase() + e.slice(1))
				.join(" "))
		: e;

/**
 * @description Convert string to camel case
 * @param {String} e
 * @returns {String} Camel case string
 */
export const convertStringToCamelCase = (e) => (typeof e === "string" && e?.length > 0 ? e.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase()) : e);

/**
 * @description Convert string to snake case
 * @param {String} e
 * @returns {String} Snake case string
 */
export const convertStringToSnakeCase = (e) => (typeof e === "string" && e?.length > 0 ? e.replace(/\s/g, "_").toLowerCase() : e);

/**
 * @description Convert string to kebab case
 * @param {String} e
 * @returns {String} Kebab case string
 */
export const convertStringToKebabCase = (e) =>
	typeof e === "string" && e?.length > 0
		? e
				.match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
				.map((x) => x.toLowerCase())
				.join("-")
		: e;

/**
 * @description Convert string to constant case
 * @param {String} e
 * @returns {String} Constant case string
 */
export const convertStringToConstantCase = (e) => (typeof e === "string" && e?.length > 0 ? e.replace(/\s/g, "_").toUpperCase() : e);

/**
 * @description Convert string to sentence case
 * @param {String} e
 * @returns {String} Sentence case string
 */
export const convertStringToSentenceCase = (e) => (typeof e === "string" && e?.length > 0 ? e.replace(/\s/g, " ").replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()) : e);

/**
 * @description Convert string to number
 * @param {String} e
 * @returns {number} Number
 */
export const convertStringToNumber = (e) => (typeof e === "string" && e?.length > 0 ? Number(e) : e);

/**
 * @description Convert string to boolean
 * @param {String} e
 * @returns {boolean} Boolean
 */
export const convertStringToBoolean = (e) => (typeof e === "string" && e?.length > 0 ? e === "true" : e);

/**
 * @description Convert string to array
 * @param {String} e
 * @returns {array} Array
 */
export const convertStringToArray = (e) => (typeof e === "string" && e?.length > 0 ? e.split(",") : e);

/**
 * @description Convert string to object
 * @param {String} e
 * @returns {object} Object
 */
export const convertStringToObject = (e) => (typeof e === "string" && e?.length > 0 ? JSON.parse(e) : e);

/**
 * @description Convert object to string
 * @param {object} e
 * @returns {String} String
 */
export const convertObjectToString = (e) => (e && Object.prototype.toString.call(e) === "[object Object]" && Object.keys(e)?.length > 0 ? JSON.stringify(e) : e);

/**
 * @description Convert array to string
 * @param {array} e
 * @returns {String} String
 */
export const convertArrayToString = (e) => (e && Object.prototype.toString.call(e) === "[object Object]" && Object.keys(e)?.length > 0 ? e.join(" ") : e);

/**
 * @description Convert number to string
 * @param {number} e
 * @returns {String} String
 */
export const convertNumberToString = (e) => (typeof e === "number" ? e.toString() : e);
