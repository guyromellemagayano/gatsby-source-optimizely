/* eslint-disable no-unused-vars */
"use strict";

import { randomUUID } from "crypto";
import { createRemoteFileNode } from "gatsby-source-filesystem";
import _ from "lodash";
import {
	ACCESS_CONTROL_ALLOW_CREDENTIALS,
	ACCESS_CONTROL_ALLOW_HEADERS,
	APP_NAME,
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
import { isArrayType, isEmpty, isObjectType } from "./utils/typeCheck";

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
		const uuid = randomUUID();

		const nodeMetadata = {
			id: createNodeId(`${uuid}-${nodeType}-${endpoint}`),
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
			?.filter(({ status = null, value: { nodeName = null, endpoint = null } }) => status === "fulfilled" && !isEmpty(nodeName) && !isEmpty(endpoint))
			?.map(async ({ status = null, value: { nodeName = null, data = null, endpoint = null } }) => {
				// Check if the data was retrieved successfully
				if (status === "fulfilled" && !isEmpty(nodeName) && !isEmpty(endpoint) && !isEmpty(data)) {
					// Handle camel casing of the data
					const updatedData = await handleCamelizeKeys(data);

					// Create nodes from the data
					if (isArrayType(updatedData)) {
						updatedData?.map(async (datum) => {
							await handleCreateNodeFromData(datum, nodeName, helpers, datum?.contentLink?.url || site_url + endpoint);
						});
					} else {
						await handleCreateNodeFromData(updatedData, nodeName, helpers, updatedData?.contentLink?.url || site_url + endpoint);
					}
				}

				// Resolve the promise
				return;
			}) || null;

		// Cache the data
		await cache.set(CACHE_KEY, sourceData).catch((err) => console.error(`[ERROR] ${err?.message} || ${convertObjectToString(err)} || "An error occurred while caching the data. Please try again later."`));

		console.info(`${APP_NAME} task processing complete!`);

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
						data: !isEmpty(results) && !isEmpty(nodeName) ? (nodeName === "OptimizelyStoreContent" || nodeName === "OptimizelyHotelContent" ? results?.Locations : results) : null,
						endpoint
					};
				}) || null
			)
				.then(async (res) => {
					// Store the data in the cache
					if (!isEmpty(res)) {
						const tempRes = res;

						tempRes.map(async (item) => {
							const tempItem = item;

							const {
								status = null,
								value: { nodeName = null, data = null, endpoint = null }
							} = tempItem;

							if (status === "fulfilled" && !isEmpty(nodeName) && !isEmpty(endpoint) && !isEmpty(data)) {
								if (nodeName === "OptimizelyStoresContent") {
									tempItem.value.data = data?.Locations?.filter((location) => location.LocationType === "Store")?.map((location) => {
										return {
											...location,
											LocationType: "Store"
										};
									});
								} else if (nodeName === "OptimizelyHotelsContent") {
									tempItem.value.data = data?.Locations?.filter((location) => location.LocationType === "Hotel")?.map((location) => {
										return {
											...location,
											LocationType: "Hotel"
										};
									});
								}
							}

							item = tempItem;

							return item;
						});

						sourceData = tempRes;
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
		console.error(`[AUTH] API authentication failed. Please check your credentials and try again.`);
	}

	return;
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

/**
 * @description Perform image optimizations on each node created
 * @param {Object} node
 * @param {Object} actions
 * @param {Object} store
 * @param {Object} cache
 * @param {Object} reporter
 * @returns {void}
 */
exports.onCreateNode = async ({ node, actions: { createNode, createNodeField }, getCache }) => {
	if (node.internal.type.includes("Optimizely")) {
		const contentBlocks = ["contentBlocks", "contentBlocksTop", "contentBlocksBottom"];
		const blockImageElementObjects = ["image", "secondary", "image1", "image2", "headerImage", "listImage", "secondaryListImage", "topImage"];
		const blockImageElementArrays = ["images", "items", "productImages"];

		Object.keys(node)?.map(async (key) => {
			await Promise.all(
				contentBlocks
					?.filter((contentBlock) => contentBlock?.includes(key))
					?.map(() => {
						node?.[key]?.map((block) => {
							const {
								contentLink: { expanded }
							} = block;

							Object.keys(expanded)?.map((expandedKey) => {
								// Check for keys that contain image objects
								blockImageElementObjects
									?.filter((imageElement) => expandedKey === imageElement)
									?.map(async () => {
										await createRemoteFileNode({
											url:
												expanded?.[expandedKey]?.contentLink?.expanded?.contentLink?.url ||
												expanded?.[expandedKey]?.contentLink?.expanded?.url ||
												expanded?.[expandedKey]?.expanded?.url ||
												expanded?.[expandedKey]?.url ||
												expanded?.[expandedKey],
											parentNodeId: node.id,
											createNode,
											createNodeId: () =>
												`${node.id}-${key}-items--${
													expanded?.[expandedKey]?.contentLink?.expanded?.contentLink?.url ||
													expanded?.[expandedKey]?.contentLink?.expanded?.url ||
													expanded?.[expandedKey]?.expanded?.url ||
													expanded?.[expandedKey]?.url ||
													expanded?.[expandedKey]
												}`,
											getCache
										});
									});

								// Check for keys that contain image objects
								blockImageElementArrays
									?.filter((imageElement) => expandedKey === imageElement)
									?.map(() => {
										expanded?.[expandedKey]?.map(async (image) => {
											await Promise.allSettled(
												blockImageElementObjects
													?.filter((imageElement) => Object.keys(image)?.includes(imageElement))
													?.map(
														async (imageElement) =>
															await createRemoteFileNode({
																url:
																	image?.[imageElement]?.contentLink?.expanded?.contentLink?.url ||
																	image?.[imageElement]?.contentLink?.expanded?.url ||
																	image?.[imageElement]?.expanded?.url ||
																	image?.[imageElement]?.url ||
																	image?.[imageElement],
																parentNodeId: node.id,
																createNode,
																createNodeId: () =>
																	`${node.id}-${key}-items--${
																		image?.[imageElement]?.contentLink?.expanded?.contentLink?.url ||
																		image?.[imageElement]?.contentLink?.expanded?.url ||
																		image?.[imageElement]?.expanded?.url ||
																		image?.[imageElement]?.url ||
																		image?.[imageElement]
																	}`,
																getCache
															})
													)
											)
												.then((res) => res)
												.catch((err) => err);
										});

										return expanded?.[expandedKey];
									});

								return expanded;
							});

							return block;
						});

						return node;
					})
			);

			await Promise.all(
				blockImageElementObjects
					?.filter((imageElement) => key === imageElement)
					?.map(async () => {
						await createRemoteFileNode({
							url: node[key]?.contentLink?.expanded?.contentLink?.url || node[key]?.expanded?.contentLink?.url || node[key]?.expanded?.url || node[key]?.url || node[key],
							parentNodeId: node.id,
							createNode,
							createNodeId: () => `${node.id}-${key}--${node[key]?.contentLink?.expanded?.contentLink?.url || node[key]?.expanded?.contentLink?.url || node[key]?.expanded?.url || node[key]?.url || node[key]}`,
							getCache
						});
					})
			);

			await Promise.all(
				blockImageElementArrays
					?.filter((imageElement) => key === imageElement)
					?.map(async () => {
						await Promise.all(
							node?.[key]?.map(
								async (element) =>
									await createRemoteFileNode({
										url: element?.contentLink?.expanded?.contentLink?.url || element?.expanded?.contentLink?.url || element?.expanded?.url || element?.url || element,
										parentNodeId: node.id,
										createNode,
										createNodeId: () => `
											${node.id}-${key}-items--${element?.contentLink?.expanded?.contentLink?.url || element?.expanded?.contentLink?.url || element?.expanded?.url || element?.url || element}`,
										getCache
									})
							)
						)
							.then((res) => res)
							.catch((err) => err);

						return node;
					})
			);
		});
	}
};
