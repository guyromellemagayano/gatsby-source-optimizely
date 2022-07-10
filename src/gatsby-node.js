"use strict";

import { FG_GREEN, FG_RED, FG_YELLOW } from "./constants";
import { convertObjectToString } from "./utils/convertValues";
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
	console.log(FG_GREEN, "\n----- @epicdesignlabs/gatsby-source-optimizely plugin loaded successfully -----\n");
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
				.description("The URL of the Optimizely site"),
			username: Joi.string()
				.required()
				.messages({
					"string.empty": "The `auth.username` is empty. Please provide a valid username.",
					"string.required": "The `auth.username` is required."
				})
				.description("The username of the Optimizely account"),
			password: Joi.string()
				.required()
				.messages({
					"string.empty": "The `auth.password` is empty. Please provide a valid password.",
					"string.required": "The `auth.password` is required."
				})
				.description("The password of the Optimizely account"),
			grant_type: Joi.string().default("password").description("The grant type of the Optimizely account"),
			client_id: Joi.string().default("Default").description("The client ID of the Optimizely account"),
			headers: Joi.object().default({}).description("The headers for the Optimizely site")
		})
			.required()
			.messages({
				"object.required": "The `auth` object is required."
			})
			.description("The auth credentials for the Optimizely site"),
		endpoints: Joi.object()
			.required()
			.messages({
				"object.required": "The `endpoints` is required."
			})
			.description("The endpoints for the Optimizely site")
	});
};

/**
 * ============================================================================
 * Source and cache nodes from the Optimizely API
 * ============================================================================
 */
exports.sourceNodes = async ({ actions, createNodeId, createContentDigest }, pluginOptions) => {
	const {
		auth: { site_url, username, password, grant_type = "password", client_id = "Default", headers = {} },
		endpoints
	} = pluginOptions;

	const helpers = Object.assign({}, actions, {
		createContentDigest,
		createNodeId
	});

	const optimizely = new Optimizely({
		site_url,
		username,
		password,
		grant_type,
		client_id,
		headers
	});

	// TODO: Process `endpoints` here
	await Promise.allSettled(
		Object.entries(endpoints).map(
			async ([nodeName, endpoint]) =>
				await optimizely
					.get(endpoint)
					.then((res) => {
						console.log(FG_YELLOW, `\nProcessing ${nodeName} - ${endpoint}...`);

						return { nodeName, res };
					})
					.catch((err) => err)
		)
	)
		.then((results) => {
			results.forEach((result) => {
				if (result.status === "fulfilled") {
					const { nodeName, res } = result.value;

					return res && Array.isArray(res) && res.length > 0 ? res.map((datum) => handleCreateNodeFromData(datum, nodeName, helpers)) : handleCreateNodeFromData(res, nodeName, helpers);
				}
			});

			console.log(FG_GREEN, "\n----- Source nodes created successfully -----");
		})
		.catch((err) => {
			console.error(FG_RED, `\n----- An error occurred while fetching endpoint data: ${err.message} -----\n`);
		})
		.finally(() => {
			console.log(FG_GREEN, "\n----- Fetching endpoint data done successfully -----\n");
		});
};
