/* eslint-disable no-unused-vars */
"use strict";

import { createRemoteFileNode } from "gatsby-source-filesystem";
import {
	ACCESS_CONTROL_ALLOW_CREDENTIALS,
	ACCESS_CONTROL_ALLOW_HEADERS,
	AUTH_CLIENT_ID,
	AUTH_GRANT_TYPE,
	AUTH_HEADERS,
	CORS_ORIGIN,
	REQUEST_CONCURRENCY,
	REQUEST_DEBOUNCE_INTERVAL,
	REQUEST_ENDPOINTS,
	REQUEST_RESPONSE_TYPE,
	REQUEST_THROTTLE_INTERVAL,
	REQUEST_TIMEOUT
} from "./constants";
import { Optimizely } from "./libs/optimizely";
import { convertObjectToString, convertStringToCamelCase } from "./utils/convertValues";
import { isEqual } from "./utils/isEqual";
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
const handleCreateNodeFromData = async (item = null, nodeType = "", helpers = {}, endpoint = "") => {
	const { createNode, createNodeId, createContentDigest } = helpers;

	if (!isEmpty(item) && !isEmpty(nodeType)) {
		const camelizedItem = handleCamelizeKeys(item);

		console.log(JSON.stringify(camelizedItem, null, 2));

		const stringifiedItem = convertObjectToString(camelizedItem);

		const nodeMetadata = {
			...item,
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

				Promise.resolve(node);
			})
			.catch((err) => {
				console.error(`[NODE] ${node?.internal?.contentDigest} - ${nodeType} (FAIL) - ${err?.message || convertObjectToString(err) || "An error occurred. Please try again later."}`);

				Promise.reject(err);
			});

		return node;
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
		endpoints: Joi.object()
			.required()
			.messages({
				"object.required": "The `endpoints` object is required."
			})
			.description("The endpoints to create nodes for"),
		response_type: Joi.string().default("json").description("The response type to use"),
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
		auth: { site_url = null, username = null, password = null, grant_type = AUTH_GRANT_TYPE, client_id = AUTH_CLIENT_ID, headers = AUTH_HEADERS } = {},
		endpoints = REQUEST_ENDPOINTS,
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

	// Store the response from the Optimizely/Episerver API in the cache
	const dataPromises = [];
	const cacheKey = "@epicdesignlabs/gatsby-source-optimizely";

	let sourceData = await cache.get(cacheKey);

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

	try {
		if (!isEmpty(auth?.access_token)) {
			// Send log message to console if authentication was successful
			console.info(`[AUTH] ${convertObjectToString(auth)}`);

			// Get the endpoints from the Optimizely/Episerver site and store as promises
			for (const [nodeName, endpoint] of Object.entries(endpoints)) {
				try {
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

					dataPromises.push({
						nodeName,
						data: results || null,
						endpoint
					});
				} catch (err) {
					// Send log message to console if an error occurred
					console.error(`[GET] ${site_url + endpoint} (${err.status + " " + err.statusText})`);

					// Reject the promise
					Promise.reject(err);
				}
			}

			if (!isEmpty(dataPromises)) {
				// Compare the data in the cache with the data from the Optimizely/Episerver site
				if (!isEqual(sourceData, dataPromises)) {
					// Store the data in the cache
					sourceData = dataPromises;

					// Cache the data
					await cache
						.set(cacheKey, sourceData)
						.then(() => {
							// If the source data is different from the cached data, display a success message
							console.info(`[CACHE] ${cacheKey} - (OK) - ${sourceData?.length || 0} items`);

							// Create nodes from the data
							sourceData?.map(({ nodeName = "", data = null, endpoint = "" }) => {
								if (!isEmpty(data) && isArrayType(data) && !isEmpty(nodeName) && isStringType(nodeName)) {
									data?.map(async (item) => {
										if (!isEmpty(item) && isArrayType(item)) {
											item?.map(async (datum) => await handleCreateNodeFromData(datum, nodeName, helpers, datum?.contentLink?.url || site_url + endpoint));
										} else {
											await handleCreateNodeFromData(item, nodeName, helpers, item?.contentLink?.url || site_url + endpoint);
										}
									});
								} else {
									const keyValues = ["Locations"];

									Object.entries(data)?.map(async ([key, value]) => {
										if (keyValues?.includes(key) && isArrayType(value) && !isEmpty(value)) {
											value?.map(async (datum) => await handleCreateNodeFromData(datum, nodeName, helpers, datum?.contentLink?.url || site_url + endpoint));
										} else {
											await handleCreateNodeFromData(value, nodeName, helpers, value?.contentLink?.url || site_url + endpoint);
										}
									});
								}
							});
						})
						.catch((err) => {
							// Send log message to console if an error occurred
							console.error(`[CACHE] ${err?.message || convertObjectToString(err) || "An error occurred. Please try again later."}`);

							// Reject the promise
							return err;
						});
				} else {
					// If the source data is the same as the cached data, display a warning message
					console.warn(`[CACHE] Cache with key ${cacheKey} was detected but no changes were made. Skipping node creation...`);
				}
			}
		}
	} catch (err) {
		// Send log message to console if an error occurred
		console.error(`[AUTH] ${err?.message || convertObjectToString(err) || "An error occurred. Please try again later."}`);

		// Reject the promise
		return err;
	}

	return;
};

/**
 * @description Create nodes from the data
 * @param {Object} node
 * @param {Object} actions
 * @param {Function} createNodeId
 * @param {Function} createContentDigest
 * @param {Function} getCache
 * @returns {Promise} Promise
 */
exports.onCreateNode = async ({ node, actions: { createNode, createNodeField }, createNodeId, getCache }) => {
	if (node?.internal?.type === "OptimizelyLocations" && node?.Images?.length > 0) {
		let fields = [];

		for (let i = 0; i < node?.Images?.length; i++) {
			const imageFileNode = await createRemoteFileNode({
				url: node?.Images[i],
				parentNodeId: node?.id,
				createNode,
				createNodeId,
				getCache
			});

			// If the file was created, attach the new node to the parent node
			if (isObjectType(imageFileNode) && !isEmpty(imageFileNode) && imageFileNode?.id) {
				fields.push(imageFileNode?.id);
			}
		}

		// If the file was created, attach the new node to the parent node
		if (!isEmpty(fields)) {
			createNodeField({
				node,
				name: "localFile___NODE",
				value: fields
			});
		}
	}
};
