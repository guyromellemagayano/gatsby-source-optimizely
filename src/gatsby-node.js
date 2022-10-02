/* eslint-disable prettier/prettier */
"use strict";

import { ACCESS_CONTROL_ALLOW_CREDENTIALS, ACCESS_CONTROL_ALLOW_HEADERS, CORS_ORIGIN, REQUEST_TIMEOUT, REQUEST_URL_SLUG } from "./constants";
import Auth from "./utils/auth";
import { convertObjectToString } from "./utils/convertValues";
import { logger } from "./utils/logger";
import Optimizely from "./utils/optimizely";

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
	const nodeMetadata = {
		...item,
		id: helpers.createNodeId(`${nodeType}-${item?.id || item?.name}`),
		parent: null,
		children: [],
		internal: {
			type: nodeType,
			content: convertObjectToString(item),
			contentDigest: helpers.createContentDigest(item)
		}
	};

	const node = Object.assign({}, item, nodeMetadata);

	try {
		await helpers.createNode(node)
		log.warn(`(OK) [CREATE NODE] ${endpoint} - ${helpers.createNodeId(`${nodeType}-${item.id || item.name}`)}`);
		return node;
	} catch (error) {
		log.error(`(FAIL) [CREATE NODE] ${endpoint} - ${helpers.createNodeId(`${nodeType}-${item.id || item.name}`)}`, error.message);
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
		log_level: Joi.string().default("info").description("The log level to use"),
		response_type: Joi.string().default("json").description("The response type to use"),
		request_timeout: Joi.number().default(REQUEST_TIMEOUT).description("The request timeout to use in milliseconds"),
		enable_cache: Joi.boolean().default(true).description("Whether to enable the cache or not")
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
exports.sourceNodes = async ({ actions, createNodeId, createContentDigest }, pluginOptions) => {
	// Prepare plugin options
	const {
		auth: { site_url = null, username = null, password = null, grant_type = "password", client_id = "Default", headers = {} },
		endpoints = null,
		log_level = "info",
		response_type = "json",
		request_timeout = REQUEST_TIMEOUT
	} = pluginOptions;

	// Custom logger based on the `log_level` plugin option
	const log = logger(log_level);

	// Prepare node sourcing helpers
	const helpers = Object.assign({}, actions, {
		createContentDigest,
		createNodeId
	});

	// Authenticate with the Optimizely/Episerver
	const auth = new Auth({ site_url, username, password, grant_type, client_id, log, response_type, request_timeout });

	const authData = await auth.post();

	log.warn("Cache is disabled or empty. Fetching fresh data from the Optimizely/Episerver API...");

	// Display the auth data
	log.info(`(OK) [AUTH] ${convertObjectToString(authData)}`);

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
		request_timeout
	});

	for (const [nodeName, endpoint] of Object.entries(endpoints)) {
		console.log("------------------------")
				console.log(nodeName)
				try {
					const res = await optimizely
						.get(endpoint);
					if (res && Array.isArray(res) && res?.length > 0) {
						await Promise.allSettled(res.map(async datum => {
							await handleCreateNodeFromData(datum, nodeName, helpers, site_url + REQUEST_URL_SLUG + endpoint, log)
						}))
					}
					else {
						await handleCreateNodeFromData(res, nodeName, helpers, site_url + REQUEST_URL_SLUG + endpoint, log)
					}
				} catch (error) {
					console.log(error)
					log.error(`An error occurred while fetching ${endpoint} endpoint data`, error.message);

				}
	}


	log.info("@epicdesignlabs/gatsby-source-optimizely task processing complete!");

	return;
};
