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
	IS_DEV,
	REQUEST_CONCURRENCY,
	REQUEST_DEBOUNCE_INTERVAL,
	REQUEST_RESPONSE_TYPE,
	REQUEST_THROTTLE_INTERVAL,
	REQUEST_TIMEOUT
} from "./constants";
import { Optimizely } from "./libs/optimizely";
import { convertObjectToString, convertStringToCamelCase } from "./utils/convertValues";
import { getURLPathname } from "./utils/parseURL";
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
const handleCreateNodeFromData = async (item, nodeType, helpers, endpoint, reporter) => {
	const { createNode, createNodeId, createContentDigest } = helpers;

	if (!isEmpty(nodeType)) {
		const stringifiedItem = !isEmpty(item) ? convertObjectToString(item) : "";
		const uuid = randomUUID();

		const nodeMetadata = {
			id: createNodeId(`${uuid}-${nodeType}-${getURLPathname(endpoint)}`),
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
				reporter.info(`[NODE] ${node?.internal?.contentDigest} - ${nodeType} - (OK)`);
				return Promise.resolve();
			})
			.catch((err) => {
				reporter.error(`[ERROR] ${err?.message || convertObjectToString(err) || "An error occurred. Please try again later."}`);
				return err;
			});
	}
};

/**
 * @description Verify if plugin loaded correctly
 * @returns {void}
 */
exports.onPreBootstrap = ({ reporter }) => reporter.info(`${APP_NAME} loaded successfully! 🎉`);

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
 * @description Source and cache nodes from the Optimizely/Episerver API
 * @param {Object} actions
 * @param {Object} reporter
 * @param {Object} createNodeId
 * @param {Object} createContentDigest
 * @param {Object} pluginOptions
 * @returns {Promise<void>} Node creation promise
 */
exports.sourceNodes = async ({ actions: { createNode }, reporter, cache, createNodeId, createContentDigest }, pluginOptions) => {
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
		client_id,
		reporter
	});

	// Action helpers
	const helpers = {
		createNode,
		createContentDigest,
		createNodeId
	};

	/**
	 * @description Handle node creation
	 * @param {Array} node
	 * @param {Object} reporter
	 * @param {Object} helpers
	 * @returns {Promise<void>} Node creation promise
	 */
	const handleNodeCreation = async (node, reporter, helpers) => {
		try {
			// Handle `stores` and `hotels` node data
			if (node.nodeName === "OptimizelyStoresContent") {
				node.data =
					node.data?.Locations?.filter((location) => location?.LocationType === "Store")?.map((location) => {
						return {
							...location,
							LocationType: "Store"
						};
					}) || null;
			} else if (node.nodeName === "OptimizelyHotelsContent") {
				node.data =
					node.data?.Locations?.filter((location) => location?.LocationType === "Hotel")?.map((location) => {
						return {
							...location,
							LocationType: "Hotel"
						};
					}) || null;
			}

			const updatedData = handleCamelizeKeys(node.data);

			// Create nodes from the data
			if (!isEmpty(updatedData)) {
				if (isArrayType(updatedData)) {
					updatedData?.map(async (datum) => {
						await handleCreateNodeFromData(datum, node.nodeName, helpers, datum?.contentLink?.url || site_url + node.endpoint, reporter);

						return Promise.resolve(datum);
					});
				} else if (isObjectType(updatedData)) {
					await handleCreateNodeFromData(updatedData, node.nodeName, helpers, updatedData?.contentLink?.url || site_url + node.endpoint, reporter);

					return Promise.resolve(updatedData);
				} else {
					return Promise.resolve(updatedData);
				}
			}
		} catch (err) {
			reporter.error(`[ERROR] ${err?.message || convertObjectToString(err) || "An error occurred while creating nodes. Please try again later."}`);
			return err;
		}
	};

	// Check if the plugin stored the data in the cache
	const cachedData = await cache.get(CACHE_KEY);
	let sourceData = null;

	if (!isEmpty(cachedData)) {
		// Send log message to reporter if the cached data is available
		reporter.warn(`[CACHE] Cached data found. Proceeding to node creation...`);

		// Create nodes from the cached data
		cachedData
			?.filter((item) => item?.status === "fulfilled")
			?.map(async (item) => {
				const resData = item?.value;

				await handleNodeCreation(resData, reporter, helpers);
			});
	} else {
		// Send log message to reporter if the cached data is not available
		reporter.warn(`[CACHE] No cached data found. Proceeding to data sourcing...`);

		// Authenticate with the Optimizely/Episerver
		const auth = await optimizely.authenticate();

		if (!isEmpty(auth?.access_token)) {
			// Send log message to reporter if authentication was successful
			reporter.info(`[AUTH] ${convertObjectToString(auth?.access_token)}`);

			await Promise.allSettled(
				endpoints.map(async ({ nodeName = null, endpoint = null }) => {
					const url = site_url + endpoint || "";

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
					sourceData
						?.filter((item) => item?.status === "fulfilled")
						?.map(async (item) => {
							if (isArrayType(item.value.data)) {
								if (item.value.nodeName === "OptimizelyStoreContent" || item.value.nodeName === "OptimizelyHotelContent") {
									item.value.data?.Locations?.map(async (datum) => {
										const data = {
											nodeName: item.value.nodeName,
											data: datum,
											endpoint: item.value.endpoint
										};

										await handleNodeCreation(data, reporter, helpers);
									});
								} else {
									item.value.data?.map(async (datum) => {
										const data = {
											nodeName: item.value.nodeName,
											data: datum,
											endpoint: item.value.endpoint
										};

										await handleNodeCreation(data, reporter, helpers);
									});
								}
							} else {
								const data = {
									nodeName: item.value.nodeName,
									data: item?.value?.data || null,
									endpoint: item.value.endpoint
								};

								await handleNodeCreation(data, reporter, helpers);
							}
						});

					// Cache the data when the data is available and the environment is development
					if (!isEmpty(sourceData) || IS_DEV) {
						await cache
							.set(CACHE_KEY, sourceData)
							.then(() => reporter.info(`[CACHE] Cached ${sourceData.length} items successfully.`))
							.catch((err) => reporter.error(`[ERROR] ${err?.message || convertObjectToString(err) || "There was an error while caching the data. Please try again later."}`));
					}

					// Resolve the promise
					return sourceData;
				})
				.catch((err) => {
					this.reporter.error(`[ERROR] ${err?.message || convertObjectToString(err) || "There was an error while fetching and expanding the endpoints. Please try again later."}`);
					return err;
				});
		} else {
			// Send error message to reporter if an error occurred
			throw new Error(`[AUTH] API authentication failed. Please check your credentials and try again.`);
		}
	}
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
exports.onCreateNode = async ({ node, actions: { createNode, createNodeField }, reporter, getCache }) => {
	if (node.internal.type?.includes("Optimizely")) {
		await Promise.allSettled(
			Object.keys(node)?.map(async (key) => {
				const contentBlocks = ["contentBlocks", "contentBlocksTop", "contentBlocksBottom"];
				const blockImageElementObjects = ["image", "secondary", "image1", "image2", "headerImage", "listImage", "secondaryListImage", "topImage"];
				const blockImageElementArrays = ["images", "items", "productImages"];

				const isContentBlock = contentBlocks.includes(key);
				const isBlockImageElementObject = blockImageElementObjects.includes(key);
				const isBlockImageElementArray = blockImageElementArrays.includes(key);

				const imageRegex = /[^\s]+(.*?).(svg|gif|SVG|GIF)$/;
				const localNodes = [];

				/**
				 * @description Handle image file node creation
				 * @param {Object} data
				 * @returns {Array} localNodes
				 */
				const handleImageFileNodeCreation = async (data) => {
					const fields = [];

					let fileNode = null;

					if (!isEmpty(data)) {
						for (let i = 0; i < data?.length; i++) {
							fileNode = await createRemoteFileNode({
								url: data[i],
								parentNodeId: node.id,
								createNode,
								createNodeId: () => `${data[i]}`,
								getCache
							});

							if (fileNode?.id) {
								fields.push(fileNode.id);
							}
						}
					}

					return Promise.resolve(fields);
				};

				/**
				 * @description Handle block image element arrays
				 * @param {Array} data
				 * @param {String} key
				 * @param {String} type
				 * @returns {*} Updated block image element array
				 */
				const handleBlockImageElementArrays = async (data, key, type) => {
					const fields1 = [];
					const fields2 = [];
					const fields3 = [];
					const fields4 = [];

					try {
						for (let i = 0; i < data?.length; i++) {
							const image1 = data[i]?.contentLink?.expanded?.contentLink?.url?.length > 0 && !imageRegex.test(data[i]?.contentLink?.expanded?.contentLink?.url) && data[i].contentLink.expanded.contentLink.url;
							const image2 = data[i]?.expanded?.contentLink?.url?.length > 0 && !imageRegex.test(data[i]?.expanded?.contentLink?.url) && data[i].expanded.contentLink.url;
							const image3 = data[i]?.url?.length > 0 && !imageRegex.test(data[i]?.url) && data[i].url;
							const image4 = data[i]?.length > 0 && !imageRegex.test(data[i]) && data[i];

							if (!isEmpty(image1)) {
								fields1.push(image1);
							}

							if (!isEmpty(image2)) {
								fields2.push(image2);
							}

							if (!isEmpty(image3)) {
								fields3.push(image3);
							}

							if (!isEmpty(image4)) {
								fields4.push(image4);
							}
						}

						if (!isEmpty(fields1)) {
							const field1Data = await handleImageFileNodeCreation(fields1);

							if (!isEmpty(field1Data)) {
								localNodes.push({
									type,
									key,
									data: field1Data
								});

								return localNodes;
							}
						}

						if (!isEmpty(fields2)) {
							const field2Data = await handleImageFileNodeCreation(fields2);

							if (!isEmpty(field2Data)) {
								localNodes.push({
									type,
									key,
									data: field2Data
								});

								return localNodes;
							}
						}

						if (!isEmpty(fields3)) {
							const field3Data = await handleImageFileNodeCreation(fields3);

							if (!isEmpty(field3Data)) {
								localNodes.push({
									type,
									key,
									data: field3Data
								});

								return localNodes;
							}
						}

						if (!isEmpty(fields4)) {
							const field4Data = await handleImageFileNodeCreation(fields4);

							if (!isEmpty(field4Data)) {
								localNodes.push({
									type,
									key,
									data: field4Data
								});

								return localNodes;
							}
						}

						return localNodes;
					} catch (err) {
						reporter.error(`[ERROR] ${err?.message || convertObjectToString(err) || "An error occurred. Please try again later."}`);
						return err;
					}
				};

				/**
				 * @description Handle block image element objects
				 * @param {*} data
				 * @param {String} key
				 * @param {String} type
				 * @returns {Object} Updatd block image element object
				 */
				const handleBlockImageElementObjects = async (data, key, type) => {
					const fields1 = [];
					const fields2 = [];
					const fields3 = [];
					const fields4 = [];

					try {
						if (!isEmpty(data)) {
							if (isObjectType(data)) {
								const image1 = data?.contentLink?.expanded?.contentLink?.url?.length > 0 && !imageRegex.test(data?.contentLink?.expanded?.contentLink?.url) && data.contentLink.expanded.contentLink.url;
								const image2 = data?.expanded?.contentLink?.url?.length > 0 && !imageRegex.test(data?.expanded?.contentLink?.url) && data.expanded.contentLink.url;
								const image3 = data?.url?.length > 0 && !imageRegex.test(data?.url) && data.url;
								const image4 = data?.length > 0 && !imageRegex.test(data) && data;

								if (!isEmpty(image1)) {
									fields1.push(image1);
								}

								if (!isEmpty(image2)) {
									fields2.push(image2);
								}

								if (!isEmpty(image3)) {
									fields3.push(image3);
								}

								if (!isEmpty(image4)) {
									fields4.push(image4);
								}
							} else if (isArrayType(data)) {
								for (let i = 0; i < data.length; i++) {
									const image1 = data[i]?.contentLink?.expanded?.contentLink?.url?.length > 0 && !imageRegex.test(data[i]?.contentLink?.expanded?.contentLink?.url) && data[i].contentLink.expanded.contentLink.url;
									const image2 = data[i]?.expanded?.contentLink?.url?.length > 0 && !imageRegex.test(data[i]?.expanded?.contentLink?.url) && data[i].expanded.contentLink.url;
									const image3 = data[i]?.url?.length > 0 && !imageRegex.test(data[i]?.url) && data[i].url;
									const image4 = data[i]?.length > 0 && !imageRegex.test(data[i]) && data[i];

									if (!isEmpty(image1)) {
										fields1.push(image1);
									}

									if (!isEmpty(image2)) {
										fields2.push(image2);
									}

									if (!isEmpty(image3)) {
										fields3.push(image3);
									}

									if (!isEmpty(image4)) {
										fields4.push(image4);
									}
								}
							}

							if (!isEmpty(fields1)) {
								const field1Data = await handleImageFileNodeCreation(fields1, key, type);

								if (!isEmpty(field1Data)) {
									localNodes.push({
										type,
										key,
										data: field1Data
									});

									return localNodes;
								}
							}

							if (!isEmpty(fields2)) {
								const field2Data = await handleImageFileNodeCreation(fields2, key, type);

								if (!isEmpty(field2Data)) {
									localNodes.push({
										type,
										key,
										data: field2Data
									});

									return localNodes;
								}
							}

							if (!isEmpty(fields3)) {
								const field3Data = await handleImageFileNodeCreation(fields3, key, type);

								if (!isEmpty(field3Data)) {
									localNodes.push({
										type,
										key,
										data: field3Data
									});

									return localNodes;
								}
							}

							if (!isEmpty(fields4)) {
								const field4Data = await handleImageFileNodeCreation(fields4, key, type);

								if (!isEmpty(field4Data)) {
									localNodes.push({
										type,
										key,
										data: field4Data
									});

									return localNodes;
								}
							}
						}
					} catch (err) {
						reporter.error(`[ERROR] ${err?.message || convertObjectToString(err) || "An error occurred. Please try again later."}`);
						return err;
					}
				};

				if (isBlockImageElementArray) {
					// Check if node has the key from blockImageElementArrays and if it is not empty
					await Promise.allSettled(blockImageElementArrays.filter((imageKey) => !isEmpty(node[imageKey])).map(async (imageKey) => await handleBlockImageElementArrays(node[imageKey], imageKey, node.internal.type)));
				} else if (isBlockImageElementObject) {
					// Check if node has the key from blockImageElementObjects and if it is not empty
					await Promise.allSettled(blockImageElementObjects.filter((imageKey) => !isEmpty(node[imageKey])).map(async (imageKey) => await handleBlockImageElementObjects(node[imageKey], imageKey, node.internal.type)));
				} else if (isContentBlock) {
					// Check if node has the key from contentBlocks and if it is not empty
					await Promise.allSettled(
						contentBlocks
							.filter((contentBlockKey) => !isEmpty(node[contentBlockKey]))
							.map((contentBlockKey) => {
								node[contentBlockKey]
									?.filter((contentBlock) => !isEmpty(contentBlock?.contentLink?.expanded))
									?.map(async (contentBlock) => {
										if (!isEmpty(contentBlock?.contentLink?.expanded)) {
											await Promise.allSettled(
												Object.keys(contentBlock?.contentLink?.expanded)?.map(async (expandedData) => {
													// Check if node has the key from blockImageElementObjects and if it is not empty
													if (blockImageElementObjects.includes(expandedData)) {
														await Promise.allSettled(
															blockImageElementObjects
																.filter((imageKey) => !isEmpty(contentBlock.contentLink.expanded[imageKey]))
																.map(async (imageKey) => await handleBlockImageElementObjects(contentBlock.contentLink.expanded[imageKey], imageKey, node.internal.type))
														);
													}

													// Check if node has the key from blockImageElementArrays and if it is not empty
													if (blockImageElementArrays.includes(expandedData)) {
														await Promise.allSettled(
															blockImageElementArrays
																.filter((imageKey) => !isEmpty(contentBlock.contentLink.expanded[imageKey]))
																.map(async (imageKey) => await handleBlockImageElementArrays(contentBlock.contentLink.expanded[imageKey], imageKey, node.internal.type))
														);
													}
												})
											);
										}
									});
							})
					);
				}

				if (localNodes.length > 0) {
					reporter.info(`[FILE] ${node.internal.contentDigest} - ${node.internal.type} - ${localNodes.length} local file ${localNodes.length > 1 ? "nodes" : "node"} created`);

					createNodeField({
						node,
						name: "localFiles",
						value: localNodes[0].data
					});
				}

				return node;
			})
		);
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
		endpoints?.forEach((endpoint) => {
			if (!isEmpty(endpoint?.nodeName) && !isEmpty(endpoint?.schema)) {
				typeDefs += `
					${endpoint.schema}
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
 * @description Verify if plugin ended successfully
 * @returns {void}
 */
exports.onPostBootstrap = ({ reporter }) => reporter.info(`${APP_NAME} tasks complete! 🎉`);
