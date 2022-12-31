/* eslint-disable no-unused-vars */
"use strict";

import _ from "lodash";
import {
	ACCESS_CONTROL_ALLOW_CREDENTIALS,
	ACCESS_CONTROL_ALLOW_HEADERS,
	AUTH_CLIENT_ID,
	AUTH_GRANT_TYPE,
	AUTH_HEADERS,
	CACHE_KEY,
	CORS_ORIGIN,
	REQUEST_CONCURRENCY,
	REQUEST_DEBOUNCE_INTERVAL,
	REQUEST_RESPONSE_TYPE,
	REQUEST_THROTTLE_INTERVAL,
	REQUEST_TIMEOUT
} from "./constants";
import { Optimizely } from "./libs/optimizely";
import { convertObjectToString, convertStringToCamelCase } from "./utils/convertValues";
import { isArrayType, isEmpty, isObjectType, isStringType } from "./utils/typeCheck";

/**
 * @description Camelize keys of an object
 * @param {Object} obj
 * @returns {Object} Object with camelCase keys
 */
const handleCamelizeKeys = (obj) => {
	if (isArrayType(obj) && !isEmpty(obj)) {
		return obj?.map((item) => handleCamelizeKeys(item));
	} else if (isObjectType(obj) && !isEmpty(obj)) {
		return Object.keys(obj).reduce(
			(result, key) => ({
				...result,
				[convertStringToCamelCase(key)]: handleCamelizeKeys(obj[key])
			}),
			{}
		);
	}

	return obj;
};
/**
 * @description Create a node from the data
 * @param {Object} item
 * @param {string} nodeType
 * @param {Object} helpers
 * @param {string} endpoint
 * @returns {Promise<void>} Node creation promise
 */
const handleCreateNodeFromData = async (item = null, nodeType = null, helpers = {}, endpoint = null) => {
	const { createNode, createNodeId, createContentDigest } = helpers;

	if (!isEmpty(item) && !isEmpty(nodeType)) {
		const stringifiedItem = convertObjectToString(item);

		const nodeMetadata = {
			id: createNodeId(`${nodeType}-${endpoint}`),
			parent: null,
			children: [],
			internal: {
				type: nodeType,
				content: stringifiedItem,
				contentDigest: createContentDigest(stringifiedItem)
			}
		};
		const node = { ...item, ...nodeMetadata };

		await createNode(node)
			.then(() => {
				console.info(`[NODE] ${node?.internal?.contentDigest} - ${nodeType} - (OK)`);

				return node;
			})
			.catch((err) => {
				console.error(`[NODE] ${node?.internal?.contentDigest} - ${nodeType} (FAIL)`);
				console.error("\n", `${err?.message || convertObjectToString(err) || "An error occurred. Please try again later."}`, "\n");

				return err;
			});
	}
};

/**
 * @description Validate the plugin options
 * @param {Object} Joi
 * @returns {Object} Joi schema
 */
exports.pluginOptionsSchema = ({ Joi }) =>
	Joi.object({
		auth: Joi.object({
			site_url: Joi.string()
				.required()
				.messages({
					"string.empty": "The `auth.site_url` is empty. Please provide a valid URL.",
					"string.required": "The `auth.site_url` is required."
				})
				.description("The URL of the Optimizely/Episerver site"),
			username: Joi.string()
				.required()
				.messages({
					"string.empty": "The `auth.username` is empty. Please provide a valid username.",
					"string.required": "The `auth.username` is required."
				})
				.description("The username of the Optimizely/Episerver account"),
			password: Joi.string()
				.required()
				.messages({
					"string.empty": "The `auth.password` is empty. Please provide a valid password.",
					"string.required": "The `auth.password` is required."
				})
				.description("The password of the Optimizely/Episerver account"),
			grant_type: Joi.string().default("password").description("The grant type of the Optimizely/Episerver account"),
			client_id: Joi.string().default("Default").description("The client ID of the Optimizely/Episerver account"),
			headers: Joi.object().default({}).description("The headers for the Optimizely/Episerver site")
		})
			.required()
			.messages({
				"object.required": "The `auth` object is required."
			})
			.description("The auth credentials for the Optimizely/Episerver site"),
		// preview: Joi.object({
		// 	webhook_url: Joi.string().when("enabled", {
		// 		is: true,
		// 		then: Joi.string()
		// 			.required()
		// 			.messages({
		// 				"string.empty": "The `preview.webhook_url` is empty. Please provide a valid URL.",
		// 				"string.required": "The `preview.webhook_url` is required."
		// 			})
		// 			.description("The webhook URL for the Optimizely/Episerver site")
		// 	})
		// }).description("The preview options for the plugin"),
		globals: Joi.object()
			.when("enabled", {
				is: true,
				then: Joi.object({
					schema: Joi.string()
						.required()
						.allow(null)
						.default(null)
						.messages({
							"string.empty": "The `globals.schema` is empty. Please provide a valid schema.",
							"string.required": "The `globals.schema` is required."
						})
						.description("The schema for the Optimizely/Episerver site")
				})
			})
			.messages({
				"object.required": "The `globals` object is required."
			})
			.description("The global options for the plugin"),
		endpoints: Joi.array()
			.required()
			.items({
				nodeName: Joi.string()
					.required()
					.messages({
						"string.empty": "The `endpoints[index].nodeName` is empty. Please provide a valid node name.",
						"string.required": "The `endpoints[index].nodeName` is required."
					})
					.description("The name of the node to create"),
				endpoint: Joi.string()
					.required()
					.messages({
						"string.empty": "The `endpoints[index].endpoint` is empty. Please provide a valid endpoint.",
						"string.required": "The `endpoints[index].endpoint` is required."
					})
					.description("The endpoint to create nodes for"),
				schema: Joi.string().allow(null).default(null).description("The schema to use for the node")
			})
			.description("The endpoints to create nodes for"),
		response_type: Joi.string().default(REQUEST_RESPONSE_TYPE).description("The response type to use"),
		request_timeout: Joi.number().default(REQUEST_TIMEOUT).description("The request timeout to use in milliseconds"),
		request_throttle_interval: Joi.number().default(REQUEST_THROTTLE_INTERVAL).description("The request throttle interval to use in milliseconds"),
		request_debounce_interval: Joi.number().default(REQUEST_DEBOUNCE_INTERVAL).description("The request debounce interval to use in milliseconds"),
		request_concurrency: Joi.number().default(REQUEST_CONCURRENCY).description("The maximum amount of concurrent requests to make at a given time")
	});

/**
 * @description Verify if plugin loaded correctly
 * @returns {void}
 */
exports.onPreInit = () => console.info("@epicdesignlabs/gatsby-source-optimizely loaded successfully!");

/**
 * @description Source and cache nodes from the Optimizely/Episerver API
 * @param {Object} actions
 * @param {Object} createNodeId
 * @param {Object} createContentDigest
 * @param {Object} pluginOptions
 * @returns {Promise<void>} Node creation promise
 */
exports.sourceNodes = async ({ actions: { createNode }, cache, createNodeId, createContentDigest }, pluginOptions) => {
	// Prepare plugin options
	const {
		auth: { site_url = null, username = null, password = null, grant_type = AUTH_GRANT_TYPE, client_id = AUTH_CLIENT_ID, headers = AUTH_HEADERS },
		// preview: { webhook_url = null },
		endpoints = [],
		response_type = REQUEST_RESPONSE_TYPE,
		request_timeout = REQUEST_TIMEOUT,
		request_throttle_interval = REQUEST_THROTTLE_INTERVAL,
		request_debounce_interval = REQUEST_DEBOUNCE_INTERVAL,
		request_concurrency = REQUEST_CONCURRENCY
	} = pluginOptions;

	// Prepare node sourcing helpers
	const helpers = {
		createNode,
		createContentDigest,
		createNodeId
	};

	let cachedData = await cache.get(CACHE_KEY);
	let sourceData = null;

	// Create a new Optimizely instance
	const optimizely = new Optimizely({
		site_url,
		response_type,
		headers: {
			...headers,
			"Access-Control-Allow-Headers": ACCESS_CONTROL_ALLOW_HEADERS,
			"Access-Control-Allow-Credentials": ACCESS_CONTROL_ALLOW_CREDENTIALS,
			"Access-Control-Allow-Origin": CORS_ORIGIN
		},
		request_timeout,
		request_throttle_interval,
		request_debounce_interval,
		request_concurrency,
		username,
		password,
		grant_type,
		client_id
	});

	// Authenticate with the Optimizely/Episerver
	const auth = await optimizely.authenticate();

	/**
	 * @description Handle node creation
	 * @param {*} sourceData
	 * @returns {Promise<void>} Node creation promise
	 */
	const handleNodeCreation = async (sourceData = null) => {
		sourceData
			?.filter(({ status = null, value: { nodeName = null, data = null, endpoint = null } }) => status === "fulfilled" && !isEmpty(nodeName) && !isEmpty(data) && !isEmpty(endpoint))
			?.map(async ({ status = null, value: { nodeName = null, data = null, endpoint = null } }) => {
				// Check if the data was retrieved successfully
				if (status === "fulfilled" && !isEmpty(data) && !isEmpty(nodeName) && isStringType(nodeName)) {
					const updatedData = handleCamelizeKeys(data);

					if (!isEmpty(updatedData)) {
						// Create nodes from the data
						if (isArrayType(updatedData)) {
							updatedData?.map(async (datum) => {
								await handleCreateNodeFromData(datum, nodeName, helpers, datum?.contentLink?.url || site_url + endpoint);
							});
						} else {
							await handleCreateNodeFromData(updatedData, nodeName, helpers, updatedData?.contentLink?.url || site_url + endpoint);
						}
					} else {
						// Send log message to console if an error occurred
						console.error(`[ERROR] No data was retrieved from the Optimizely/Episerver API. Please check your credentials and try again.`);
					}
				}
			});

		// Cache the data
		await cache
			.set(CACHE_KEY, sourceData)
			.then(() => console.info(`[CACHE] Node creation performed successfully!`))
			.catch((error) => console.error(`[ERROR] There was an error caching the data. ${convertObjectToString(error)}`))
			.finally(() => console.info("@epicdesignlabs/gatsby-source-optimizely finished sourcing nodes successfully!"));

		// Resolve the promise
		return sourceData;
	};

	if (!isEmpty(auth?.access_token)) {
		// Send log message to console if authentication was successful
		console.info(`[AUTH] ${convertObjectToString(auth?.access_token)}`);

		if (!isEmpty(cachedData)) {
			// Send log message to console if the cached data is available
			console.warn(`[CACHE] Current cache is available. Proceeding to node creation...`);

			// Create nodes from the cached data
			await handleNodeCreation(cachedData);

			// Resolve the promise
			return cachedData;
		} else {
			// Send log message to console if the cached data is not available
			console.warn(`[CACHE] Current cache is not available. Proceeding to source data...`);

			await Promise.allSettled(
				endpoints?.map(async ({ nodeName = null, endpoint = null }) => {
					const url = site_url + endpoint;

					const results = await optimizely.get({
						url,
						headers: {
							...headers,
							"Authorization": `Bearer ${auth?.access_token}`,
							"Access-Control-Allow-Credentials": ACCESS_CONTROL_ALLOW_CREDENTIALS
						},
						endpoint: nodeName
					});

					// Resolve the promise
					return {
						nodeName,
						data: results || null,
						endpoint
					};
				})
			)
				.then(async (res) => {
					// Store the data in the cache
					if (!isEmpty(res)) {
						sourceData = res;
					}

					// Create nodes from the cached data
					await handleNodeCreation(sourceData);

					// Resolve the promise
					return sourceData;
				})
				.catch((err) => {
					// Send log message to console if an error occurred
					console.error(`[GET] ${err?.message || convertObjectToString(err) || "An error occurred. Please try again later."}`);

					// Reject the promise
					return err;
				});
		}

		return;
	} else {
		// Send error message to console if an error occurred
		throw new Error(`[AUTH] API authentication failed. Please check your credentials and try again.`);
	}
};

/**
 * @description Create schema customizations
 * @param {Object} actions
 * @returns {void}
 */
exports.createSchemaCustomization = ({ actions: { createTypes } }, pluginOptions) => {
	let typeDefs = ``;

	const { globals: { schema = null } = null, endpoints = [] } = pluginOptions;

	if (!isEmpty(endpoints)) {
		endpoints?.map(({ nodeName = null, schema = null }) => {
			if (!isEmpty(nodeName) && !isEmpty(schema)) {
				typeDefs += `
					${schema}
				`;
			}
		});
	}

	if (!isEmpty(schema)) {
		typeDefs += `
			${schema}
		`;
	}

	if (!isEmpty(typeDefs)) {
		typeDefs = _.trim(typeDefs);

		createTypes(typeDefs);
	}

	return;
};
