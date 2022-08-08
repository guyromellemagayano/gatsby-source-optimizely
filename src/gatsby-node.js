"use strict";

import { ACCESS_CONTROL_ALLOW_CREDENTIALS, ACCESS_CONTROL_ALLOW_HEADERS, AUTH_REQUEST_CONTENT_TYPE_HEADER, CORS_ORIGIN, OPTIMIZELY_AUTH_ENDPOINT, REQUEST_ACCEPT_HEADER, REQUEST_TIMEOUT, REQUEST_URL_SLUG } from "./constants";
import { convertObjectToString } from "./utils/convertValues";
import { logger } from "./utils/logger";
import Optimizely from "./utils/optimizely";
import qs from "qs";
import axios from "axios";

/**
 * @description Create a node from the data
 * @param {Object} item
 * @param {string} nodeType
 * @param {Object} helpers
 * @returns {Promise<void>} Node creation promise
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

	helpers
		.createNode(node)
		.then(() => {
			//		log.warn(`(OK) [CREATE NODE] ${endpoint} - ${helpers.createNodeId(`${nodeType}-${item.id || item.name}`)}`);

			return node;
		})
		.catch((err) => {
			//	log.error(`(FAIL) [CREATE NODE] ${endpoint} - ${helpers.createNodeId(`${nodeType}-${item.id || item.name}`)}`, err.message);

			throw err;
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
		request_timeout: Joi.number().default(REQUEST_TIMEOUT).description("The request timeout to use in milliseconds")
	});

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
		auth: { site_url = null, username = null, password = null, grant_type = "password", client_id = "Default" },
		endpoints = null,
		log_level = "debug",
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

	var config = {
		method: "post",
		url: site_url + REQUEST_URL_SLUG + OPTIMIZELY_AUTH_ENDPOINT,
		headers: {
			"Accept": REQUEST_ACCEPT_HEADER,
			"Content-Type": AUTH_REQUEST_CONTENT_TYPE_HEADER
		},
		data: qs.stringify({
			password: password,
			username: username,
			grant_type: grant_type,
			client_id: client_id
		})
	};

	const { data } = await axios(config);

	const headers = {
		"Authorization": `Bearer ${data.access_token}`,
		"Access-Control-Allow-Headers": ACCESS_CONTROL_ALLOW_HEADERS,
		"Access-Control-Allow-Credentials": ACCESS_CONTROL_ALLOW_CREDENTIALS,
		"Access-Control-Allow-Origin": CORS_ORIGIN
	};

	console.log("------------");
	console.log(`Bearer ${data.access_token}`);
	console.log("------------");

	// Create a new Optimizely instance
	const optimizely = new Optimizely({
		site_url,
		username,
		password,
		grant_type,
		client_id,
		response_type,
		headers,
		log,
		request_timeout
	});

	// Authenticate with Optimizely
	// const authPromise = optimizely.checkAccessToken();

	// Get the endpoints from the Optimizely/Episerver site and create nodes
	await Promise.allSettled(
		Object.entries(endpoints).map(
			async ([nodeName, endpoint]) =>
				await optimizely
					.get(endpoint)
					.then((res) => {
						// Create node for each item in the response
						return res && Array.isArray(res) && res.length > 0
							? res.map((datum) => handleCreateNodeFromData(datum, nodeName, helpers))
							: handleCreateNodeFromData(res, nodeName, helpers);
					})
					.catch((err) => {
						log.error(`An error occurred while fetching ${endpoint} endpoint data: ${err.message}`);

						return err;
					})
		)
	);
};
