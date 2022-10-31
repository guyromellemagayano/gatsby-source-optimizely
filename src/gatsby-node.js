"use strict";

import crypto from "crypto";
import { ACCESS_CONTROL_ALLOW_CREDENTIALS, ACCESS_CONTROL_ALLOW_HEADERS, CONTENT_ENDPOINT, CORS_ORIGIN, REQUEST_DEBOUNCE_INTERVAL, REQUEST_THROTTLE_INTERVAL, REQUEST_TIMEOUT, REQUEST_URL_SLUG } from "./constants";
import Auth from "./utils/auth";
import { convertObjectToString, convertStringToLowercase } from "./utils/convertValues";
import { Optimizely } from "./utils/optimizely";

/**
 * @description Source nodes from cache
 * @param {Object} cache
 * @returns {Promise<void>} Cache promise
 */
const handleSourceNodesFromCache = async (cache = null, helpers = null) =>
	await Promise.allSettled(
		cache?.map((result) => {
			const { nodeName = null, data = null } = result;

			return data && Array.isArray(data) && data.length > 0
				? data.map(async (item) => {
						if (item && Array.isArray(item) && item.length > 0) {
							item.map(async (datum) => await handleCreateNodeFromData(datum, nodeName, helpers, convertStringToLowercase(datum?.contentLink?.url)));
						} else await handleCreateNodeFromData(item, nodeName, helpers, convertStringToLowercase(item?.contentLink?.url));
				  })
				: result;
		}) || null
	)
		.then((res) =>
			Promise.resolve(() => {
				console.info(`[NODE] Cache (OK)`);
				return res;
			})
		)
		.catch((err) =>
			Promise.reject(() => {
				console.error("[NODE] Cache (FAIL)", err.message);
				throw err;
			})
		);

/**
 * @description Create a node from the data
 * @param {Object} item
 * @param {string} nodeType
 * @param {Object} helpers
 * @param {string} endpoint
 * @returns {Promise<void>} Node creation promise
 */
const handleCreateNodeFromData = async (item = null, nodeType = null, helpers = null, endpoint = null) => {
	const { createNode, createNodeId, createContentDigest } = helpers;

	if (item && Object.prototype.toString.call(item) === "[object Object]" && Object.keys(item)?.length > 0 && typeof endpoint === "string" && endpoint.length > 0) {
		const nodeMetadata = {
			...item,
			id: createNodeId(`${nodeType}-${endpoint}`),
			parent: null,
			children: [],
			internal: {
				type: nodeType,
				content: convertObjectToString(item),
				contentDigest: createContentDigest(convertObjectToString(item))
			}
		};

		const node = Object.assign({}, item, nodeMetadata);

		await createNode(node)
			.then(() =>
				Promise.resolve(() => {
					console.info(`[NODE] ${endpoint} - ${nodeType} (OK)`);
					return node;
				})
			)
			.catch((err) =>
				Promise.reject(() => {
					console.error(`[NODE] ${endpoint} - ${nodeType} (FAIL)`, err.message);
					throw err;
				})
			);

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
		request_debounce_interval: Joi.number().default(REQUEST_DEBOUNCE_INTERVAL).description("The request debounce interval to use in milliseconds")
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
exports.sourceNodes = async ({ actions, cache, createNodeId, createContentDigest }, pluginOptions) => {
	// Prepare plugin options
	const {
		auth: { site_url = null, username = null, password = null, grant_type = "password", client_id = "Default", headers = {} },
		endpoints = null,
		response_type = "json",
		request_timeout = REQUEST_TIMEOUT,
		request_throttle_interval = REQUEST_THROTTLE_INTERVAL,
		request_debounce_interval = REQUEST_DEBOUNCE_INTERVAL
	} = pluginOptions;

	// Prepare node sourcing helpers
	const helpers = Object.assign({}, actions, {
		createContentDigest,
		createNodeId
	});

	// Store the response from the Optimizely/Episerver API in the cache
	const cacheKey = crypto.createHash("md5").update(JSON.stringify(pluginOptions)).digest("hex");
	let sourceData = await cache.get(cacheKey);

	// If the data is not cached, fetch it from the Optimizely/Episerver API
	if (!sourceData) {
		console.warn(`Cache is empty. Fetching fresh data from the Optimizely/Episerver API...`);

		// Authenticate with the Optimizely/Episerver
		const auth = new Auth({ site_url, username, password, grant_type, client_id, response_type, request_timeout });

		const authData = await auth.post();

		// Display the auth data
		authData?.access_token ? console.info(`[TOKEN] ${authData.access_token} - (OK)`) : console.error(`[TOKEN] ${authData.access_token} - (FAIL)`);

		// Create a new Optimizely instance
		const optimizely = new Optimizely({
			site_url,
			response_type,
			headers: Object.assign(headers, {
				"Authorization": `Bearer ${authData.access_token}`,
				"Access-Control-Allow-Headers": ACCESS_CONTROL_ALLOW_HEADERS,
				"Access-Control-Allow-Credentials": ACCESS_CONTROL_ALLOW_CREDENTIALS,
				"Access-Control-Allow-Origin": CORS_ORIGIN
			}),
			request_timeout,
			request_throttle_interval,
			request_debounce_interval
		});

		// Handle expanded keys and their values
		const expandKeyValues = async (items, nodeName, endpoint) => {
			const tempItems = [];

			if (items && Array.isArray(items) && items?.length > 0) {
				items.map(async (item = null) => {
					const tempItem = Object.assign({}, item);

					if (tempItem?.contentLink?.id && typeof tempItem?.contentLink?.id === "number") {
						tempItems.push(await optimizely.request(`${CONTENT_ENDPOINT + tempItem.contentLink.id + "?expand=*"}`, nodeName, "get"));
					}

					return tempItem;
				});
			} else if (items && Object.prototype.toString.call(items) === "[object Object]" && Object.keys(items).length > 0) {
				const tempItem = Object.assign({}, items);

				if (tempItem?.contentLink?.id && typeof tempItem?.contentLink?.id === "number") {
					tempItems.push(await optimizely.request(`${CONTENT_ENDPOINT + tempItem.contentLink.id + "?expand=*"}`, nodeName, "get"));
				}

				return tempItem;
			} else {
				return items;
			}

			await Promise.allSettled(tempItems)
				.then((res) =>
					Promise.resolve(
						res && Array.isArray(res) && res?.length > 0
							? res.map(({ value = null }, index) => {
									const { data = null } = value;
									const updatedValue = { ...items[index], ...data };

									console.info(`[DATA] ${site_url + REQUEST_URL_SLUG + endpoint} - ${nodeName} - (OK)`);

									return updatedValue;
							  })
							: res
					)
				)
				.catch((err) =>
					Promise.reject(() => {
						console.error(`[DATA] ${site_url + REQUEST_URL_SLUG + endpoint} - ${nodeName} - (FAIL)`, err.message);
						throw err;
					})
				);
		};

		// Handle expanded content blocks
		const expandContentBlocks = async (blocks, nodeName, endpoint) => {
			const tempBlocks = [];

			if (blocks && Array.isArray(blocks) && blocks?.length > 0) {
				await Promise.allSettled(
					blocks.map(async (block) => {
						const tempBlock = Object.assign({}, block);

						const { contentLink: { expanded: { dynamicStyles = null, items = null, images = null, form = null } = null } = null } = tempBlock;

						if (dynamicStyles) {
							const dynamicStylesPromise = await expandKeyValues(dynamicStyles, nodeName, endpoint);
							tempBlocks.push(dynamicStylesPromise);
						}

						if (items) {
							const itemsPromise = await expandKeyValues(items, nodeName, endpoint);
							tempBlocks.push(itemsPromise);
						}

						if (images) {
							const imagesPromise = await expandKeyValues(images, nodeName, endpoint);
							tempBlocks.push(imagesPromise);
						}

						if (form) {
							const formPromise = await expandKeyValues(form, nodeName, endpoint);
							tempBlocks.push(formPromise);
						}

						return tempBlock;
					})
				)
					.then((res) => Promise.resolve(res))
					.catch((err) => Promise.reject(err));
			} else if (blocks && Object.prototype.toString.call(blocks) === "[object Object]" && Object.keys(blocks).length > 0) {
				const tempBlock = Object.assign({}, blocks);

				const { contentLink: { expanded: { dynamicStyles = null, items = null, images = null, form = null } = null } = null } = tempBlock;

				if (dynamicStyles) {
					const dynamicStylesPromise = await expandKeyValues(dynamicStyles, nodeName, endpoint);
					tempBlocks.push(dynamicStylesPromise);
				}

				if (items) {
					const itemsPromise = await expandKeyValues(items, nodeName, endpoint);
					tempBlocks.push(itemsPromise);
				}

				if (images) {
					const imagesPromise = await expandKeyValues(images, nodeName, endpoint);
					tempBlocks.push(imagesPromise);
				}

				if (form) {
					const formPromise = await expandKeyValues(form, nodeName, endpoint);
					tempBlocks.push(formPromise);
				}

				return tempBlock;
			} else {
				return blocks;
			}

			await Promise.allSettled(tempBlocks)
				.then((res) =>
					res && Array.isArray(res) && res?.length > 0
						? res.map(({ value = null }, index) => {
								const { data = null } = value;
								const updatedValue = { ...blocks[index], ...data };

								console.info(`[EXPAND] ${endpoint} - ${nodeName} - (OK)`);

								return updatedValue;
						  })
						: res
				)
				.catch((err) =>
					Promise.reject(() => {
						console.error(`[EXPAND] ${endpoint} - ${nodeName} - (FAIL)`, err.message);
						throw err;
					})
				);
		};

		const data = [];

		// Get the endpoints from the Optimizely/Episerver site and store as promises
		for (const [nodeName, endpoint] of Object.entries(endpoints)) {
			const url = site_url + REQUEST_URL_SLUG + endpoint;

			try {
				const res = await optimizely.request(endpoint, nodeName, "get");

				if (res && Array.isArray(res) && res?.length > 0) {
					await Promise.allSettled(
						res.map(async (item) => {
							// Shallow copy of the item
							const tempItem = Object.assign({}, item);

							// Check if the item has a content block properties
							const { contentBlocks = null, contentBlocksTop = null, contentBlocksBottom = null } = tempItem;

							// If the item has a content block property, fetch the content block data and expand its properties
							if (contentBlocks && Array.isArray(contentBlocks) && contentBlocks?.length > 0) {
								const expandedContentBlocks = await expandContentBlocks(contentBlocks, nodeName, endpoint);
								tempItem.contentBlocks = expandedContentBlocks;
							}

							// If the item has a content block property, fetch the content block data and expand its properties
							if (contentBlocksTop && Array.isArray(contentBlocksTop) && contentBlocksTop?.length > 0) {
								const expandedContentBlocks = await expandContentBlocks(contentBlocksTop, nodeName, endpoint);
								tempItem.contentBlocksTop = expandedContentBlocks;
							}

							// If the item has a content block property, fetch the content block data and expand its properties
							if (contentBlocksBottom && Array.isArray(contentBlocksBottom) && contentBlocksBottom?.length > 0) {
								const expandedContentBlocks = await expandContentBlocks(contentBlocksBottom, nodeName, endpoint);
								tempItem.contentBlocksBottom = expandedContentBlocks;
							}

							return tempItem;
						})
					)
						.then((res) => {
							data.push({ [nodeName]: res });
							console.info(`[EXPAND] ${url} - ${nodeName} - (OK)`);
							return res;
						})
						.catch((err) => {
							console.error(`[EXPAND] ${url} - ${nodeName} - (FAIL)`, err.message);
							throw err;
						});
				} else {
					try {
						// Shallow copy of the item
						const tempItem = Object.assign({}, res);

						// Check if the item has a content block properties
						const { contentBlocks = null, contentBlocksTop = null, contentBlocksBottom = null } = tempItem;

						// If the item has a content block property, fetch the content block data and expand its properties
						if (contentBlocks && Array.isArray(contentBlocks) && contentBlocks?.length > 0) {
							const expandedContentBlocks = await expandContentBlocks(contentBlocks, nodeName, endpoint);
							tempItem.contentBlocks = expandedContentBlocks;
						}

						// If the item has a content block property, fetch the content block data and expand its properties
						if (contentBlocksTop && Array.isArray(contentBlocksTop) && contentBlocksTop?.length > 0) {
							const expandedContentBlocks = await expandContentBlocks(contentBlocksTop, nodeName, endpoint);
							tempItem.contentBlocksTop = expandedContentBlocks;
						}

						// If the item has a content block property, fetch the content block data and expand its properties
						if (contentBlocksBottom && Array.isArray(contentBlocksBottom) && contentBlocksBottom?.length > 0) {
							const expandedContentBlocks = await expandContentBlocks(contentBlocksBottom, nodeName, endpoint);
							tempItem.contentBlocksBottom = expandedContentBlocks;
						}

						data.push({ [nodeName]: tempItem });
						console.info(`[EXPAND] ${url} - ${nodeName} - (OK)`);
						return tempItem;
					} catch (err) {
						console.error(`[EXPAND] ${url} - ${nodeName} - (FAIL)`, err.message);
						throw err;
					}
				}
			} catch (err) {
				console.error(`[ENDPOINTS] ${url} - ${nodeName} - (FAIL)`, err.message);
				throw err;
			}
		}
	} else {
		// If the data is cached, display a success message
		console.info(`[CACHE] Detected with hash key ${cacheKey} containing ${sourceData.length || 0} items`);

		// Create nodes from the cached data
		await handleSourceNodesFromCache(sourceData, helpers);
	}
};

exports.onPostBuild = async ({ reporter, basePath, pathPrefix }) => reporter.info(`@epicdesignlabs/gatsby-source-optimizely task processing complete with current site built with "basePath": ${basePath} and "pathPrefix": ${pathPrefix}`);
