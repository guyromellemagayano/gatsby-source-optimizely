"use strict";

import { ACCESS_CONTROL_ALLOW_CREDENTIALS, ACCESS_CONTROL_ALLOW_HEADERS, CORS_ORIGIN, REQUEST_THROTTLE_INTERVAL, REQUEST_TIMEOUT, REQUEST_URL_SLUG } from "./constants";
import Auth from "./utils/auth";
import { convertObjectToString, convertStringToLowercase } from "./utils/convertValues";
import { logger } from "./utils/logger";
import { Optimizely } from "./utils/optimizely";

/**
 * @description Create a node from the data
 * @param {Object} item
 * @param {string} nodeType
 * @param {Object} helpers
 * @param {string} endpoint
 * @param {Object} log
 * @returns {Promise<void>} Node creation promise
 */
const handleCreateNodeFromData = async (item, nodeType, helpers, endpoint, log) => {
	const { createNode, createNodeId, createContentDigest } = helpers;

	const nodeMetadata = {
		...item,
		id: createNodeId(`${nodeType}-${endpoint}`),
		parent: null,
		children: [],
		internal: {
			type: nodeType,
			content: convertObjectToString(item),
			contentDigest: createContentDigest(item)
		}
	};

	const node = Object.assign({}, item, nodeMetadata);

	await createNode(node)
		.then(() => {
			log.http(`[NODE] ${endpoint} - ${createNodeId(`${nodeType}-${endpoint}`)} (OK)`);

			return Promise.resolve(node);
		})
		.catch((err) => {
			log.error(`[NODE] ${endpoint} - ${createNodeId(`${nodeType}-${endpoint}`)} (FAIL)`);

			return Promise.reject(err);
		});
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
		log_level: Joi.string().default("debug").description("The log level to use"),
		response_type: Joi.string().default("json").description("The response type to use"),
		request_timeout: Joi.number().default(REQUEST_TIMEOUT).description("The request timeout to use in milliseconds"),
		request_throttle_interval: Joi.number().default(REQUEST_THROTTLE_INTERVAL).description("The request throttle interval to use in milliseconds")
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
		log_level = "debug",
		response_type = "json",
		request_timeout = REQUEST_TIMEOUT,
		request_throttle_interval = REQUEST_THROTTLE_INTERVAL
	} = pluginOptions;

	// Custom logger based on the `log_level` plugin option
	const log = logger(log_level);

	// Prepare node sourcing helpers
	const helpers = Object.assign({}, actions, {
		createContentDigest,
		createNodeId
	});

	// Store the response from the Optimizely/Episerver API in the cache
	const cacheKey = "gatsby-source-optimizely-api-data-key";
	const nodes = [];

	let sourceData = await cache.get(cacheKey);

	// If the data is not cached, fetch it from the Optimizely/Episerver API
	if (!sourceData) {
		// Authenticate with the Optimizely/Episerver
		const auth = new Auth({ site_url, username, password, grant_type, client_id, log, response_type, request_timeout });

		const authData = await auth.post();

		// Display the auth data
		authData?.access_token ? log.info(`[AUTH] ${authData.access_token} - OK`) : log.error(`[AUTH] ${authData.access_token} - FAIL`);

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
			log,
			request_timeout,
			request_throttle_interval
		});

		for (const [nodeName, endpoint] of Object.entries(endpoints)) {
			try {
				const res = await optimizely.get(endpoint);

				nodes.push({
					nodeName,
					data: res
				});

				if (res && Array.isArray(res) && res?.length > 0) {
					await Promise.allSettled(res.map(async (datum) => await handleCreateNodeFromData(datum, nodeName, helpers, convertStringToLowercase(datum.contentLink.url), log)));
				} else {
					await handleCreateNodeFromData(res, nodeName, helpers, endpoint, log);
				}
			} catch (err) {
				log.error(`[GET] ${site_url + REQUEST_URL_SLUG + endpoint} (${err.status + " " + err.statusText})`);

				return Promise.reject(err);
			}
		}

		// Store the response from the Optimizely/Episerver API in the cache
		sourceData = nodes.length > 0 ? nodes : sourceData;

		// Cache the data
		await cache
			.set(cacheKey, sourceData)
			.then(() => {
				// If the data is cached, display a success message
				log.info(`[CACHE] ${cacheKey} (OK) - ${sourceData?.length || 0} items`);

				return Promise.resolve();
			})
			.catch((err) => {
				// If the data is not cached, display an error message
				log.error(`[CACHE] ${cacheKey} (FAIL)`);

				return Promise.reject(err);
			});
	} else {
		// Create nodes for each item in the cached response
		sourceData?.map(({ nodeName = "", data = [] }) =>
			data?.map(async (item) =>
				item && Array.isArray(item) && item.length > 0
					? await Promise.allSettled(item.map(async (datum) => await handleCreateNodeFromData(datum, nodeName, helpers, convertStringToLowercase(datum.contentLink.url), log)))
					: await handleCreateNodeFromData(item, nodeName, helpers, convertStringToLowercase(item.contentLink.url), log)
			)
		) || null;
	}

	log.info("@epicdesignlabs/gatsby-source-optimizely task processing complete!");

	return;
};
