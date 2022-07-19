"use strict";

import { REQUEST_TIMEOUT } from "./constants";
import { convertObjectToString } from "./utils/convertValues";
import { logger } from "./utils/logger";
import Optimizely from "./utils/optimizely";

/**
 * ============================================================================
 * Helper functions
 * ============================================================================
 */
const handleCreateNodeFromData = (item, nodeType, helpers) => {
	const nodeMetadata = {
		...item,
		id: helpers.createNodeId(`${nodeType}-${item.id || item.name}`),
		optimizely_id: item.id,
		parent: null,
		children: [],
		internal: {
			type: nodeType,
			content: convertObjectToString(item),
			contentDigest: helpers.createContentDigest(item)
		}
	};

	const node = Object.assign({}, item, nodeMetadata);

	helpers.createNode(node);

	return node;
};

/**
 * ============================================================================
 * Verify plugin loads
 * ============================================================================
 */
exports.onPreInit = () => {
	logger.info("@epicdesignlabs/gatsby-source-optimizely plugin loaded successfully");
};

/**
 * ============================================================================
 * Validate plugin options
 * ============================================================================
 */
exports.pluginOptionsSchema = async ({ Joi }) => {
	return Joi.object({
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
				"object.required": "The `endpoints` is required."
			})
			.description("The endpoints for the Optimizely/Episerver site"),
		log_level: Joi.string().default("debug").description("The log level to use"),
		response_type: Joi.string().default("json").description("The response type to use"),
		request_timeout: Joi.number().default(REQUEST_TIMEOUT).description("The request timeout to use in milliseconds")
	});
};

/**
 * ============================================================================
 * Source and cache nodes from the Optimizely/Episerver API
 * ============================================================================
 */
exports.sourceNodes = async ({ actions, createNodeId, createContentDigest }, pluginOptions) => {
	// Prepare plugin options
	const {
		auth: { site_url, username, password, grant_type = "password", client_id = "Default", headers = {} },
		endpoints = null,
		log_level = "debug",
		response_type = "json",
		request_timeout = REQUEST_TIMEOUT
	} = pluginOptions;

	// Prepare node sourcing helpers
	const helpers = Object.assign({}, actions, {
		createContentDigest,
		createNodeId
	});

	// Create a new Optimizely instance
	const optimizely = new Optimizely({
		site_url,
		username,
		password,
		grant_type,
		client_id,
		response_type,
		headers,
		log_level,
		request_timeout
	});

	await Promise.allSettled(
		Object.entries(endpoints).map(
			async ([nodeName, endpoint]) =>
				await optimizely
					.get(endpoint)
					.then((res) => {
						logger.info(`Success fetching data in ${endpoint}. Preparing data for node creation...`);

						// Create node for each item in the response
						return res && Array.isArray(res) && res.length > 0 ? res.map((datum) => handleCreateNodeFromData(datum, nodeName, helpers)) : handleCreateNodeFromData(res, nodeName, helpers);
					})
					.catch((err) => {
						logger.error(`An error occurred while fetching Optimizely/Episerver endpoint data: ${err}`);

						return err;
					})
					.finally(() => {
						logger.info("Fetching Optimizely/Episerver endpoint data done successfully");

						return true;
					})
		)
	);
};
