"use strict";

import crypto from "crypto";
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
import { convertObjectToString, convertStringToLowercase } from "./utils/convertValues";
import { isEqual } from "./utils/isEqual";
import { isEmpty } from "./utils/typeCheck";

/**
 * @description Source nodes from cache
 * @param {Object} cache
 * @returns {Promise<void>} Cache promise
 */
const handleSourceNodesFromCache = async (cache = null, helpers = {}) => {
	if (!isEmpty(cache)) {
		await Promise.allSettled(
			cache.map(async (result) => {
				const { nodeName = "", data = null } = result;

				await handleCreateNodeFromData(data, nodeName, helpers, convertStringToLowercase(data?.contentLink?.url));
			})
		)
			.then((res) => {
				// Send log message to console if node creation was successful
				console.info(`@epicdesignlabs/gatsby-source-optimizely: Successfully created nodes from ${cache?.length} endpoint(s)`);

				return Promise.resolve(res);
			})
			.catch((err) => {
				// Send log message to console if node creation failed
				console.error(`@epicdesignlabs/gatsby-source-optimizely: Failed to create nodes from ${cache?.length} endpoint(s) - ${err.message}`);

				return Promise.reject(err);
			});
	}
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

	if (item && Object.prototype.toString.call(item) === "[object Object]" && Object.keys(item)?.length > 0 && typeof endpoint === "string" && endpoint?.length > 0) {
		const stringifiedItem = convertObjectToString(item);

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
				console.info(`[NODE] ${endpoint} - ${nodeType} (OK)`);
				Promise.resolve(node);
			})
			.catch((err) => {
				console.error(`[NODE] ${endpoint} - ${nodeType} (FAIL) - ${err.message}`);
				Promise.reject((err) => err);
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
exports.sourceNodes = async ({ actions, cache, createNodeId, createContentDigest }, pluginOptions) => {
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
		...actions,
		createContentDigest,
		createNodeId
	};

	// Store the response from the Optimizely/Episerver API in the cache
	const cacheKey = crypto.createHash("sha256").update(JSON.stringify(pluginOptions)).digest("hex");
	const dataPromises = [];

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
					data: results || null
				});
			} catch (err) {
				// Send log message to console if an error occurred
				console.error(`[GET] ${site_url + endpoint} (${err.status + " " + err.statusText})`);

				// Reject the promise
				return Promise.reject(err);
			}
		}

		if (!isEmpty(dataPromises)) {
			// Compare the data in the cache with the data from the Optimizely/Episerver site
			if (!isEqual(sourceData, dataPromises)) {
				// Store the data in the cache
				sourceData = dataPromises || sourceData;

				// If the source data is different from the cached data, display a success message
				console.info(`[CACHE] ${cacheKey} (OK) - ${sourceData?.length || 0} items`);

				// Cache the data
				await cache.set(cacheKey, sourceData);
			} else {
				// If the source data is the same as the cached data, display a warning message
				console.warn(`[CACHE] Cache with key ${cacheKey} was detected but no changes were made. Proceeding with node creation using cached data.`);
			}

			console.log(sourceData);

			// Create nodes from the data
			sourceData?.map(({ nodeName = "", data = null }) =>
				data?.map(async (item) =>
					item && Array.isArray(item) && item.length > 0
						? await Promise.allSettled(item.map(async (datum) => await handleCreateNodeFromData(datum, nodeName, helpers, datum.contentLink.url)))
						: await handleCreateNodeFromData(item, nodeName, helpers, item.contentLink.url)
				)
			);
		} else {
			console.error(`@epicdesignlabs/gatsby-source-optimizely: No data was sourced from ${site_url}`);

			return Promise.reject();
		}
	} else {
		console.error(`[AUTH] ${site_url} (${auth?.error_description})`);

		return Promise.reject(auth);
	}
};

exports.onPostBuild = async ({ reporter, basePath, pathPrefix }) => reporter.info(`@epicdesignlabs/gatsby-source-optimizely task processing complete with current site built with "basePath": ${basePath} and "pathPrefix": ${pathPrefix}`);
