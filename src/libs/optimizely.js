"use strict";

import qs from "qs";
import { AUTH_ENDPOINT, AUTH_REQUEST_CONTENT_TYPE_HEADER, CONTENT_ENDPOINT, REQUEST_ACCEPT_HEADER, REQUEST_URL_SLUG } from "../constants";
import { convertObjectToString } from "../utils/convertValues";
import { isEqual } from "../utils/isEqual";
import { isArrayType, isEmpty, isObjectType } from "../utils/typeCheck";
import { Request } from "./request";

export class Optimizely {
	constructor(config) {
		if (!config) {
			throw new Error("Optimizely/Episerver API config required. It is required to make any call to the API");
		}

		this.site_url = config.site_url;
		this.response_type = config.response_type;
		this.headers = config.headers;
		this.request_timeout = config.request_timeout;
		this.request_throttle_interval = config.request_throttle_interval;
		this.request_debounce_interval = config.request_debounce_interval;
		this.request_concurrency = config.request_concurrency;
		this.request_max_count = config.request_max_count;
		this.username = config.username;
		this.password = config.password;
		this.grant_type = config.grant_type;
		this.client_id = config.client_id;
	}

	/**
	 * @description Handle API requests
	 * @param {String} url
	 * @param {String} method
	 * @param {Object} body
	 * @param {Object} headers
	 * @returns {Object} API response
	 */
	async request({ url = null, method = "", body = null, headers = null, endpoint = null }) {
		// Prepare `url` for request execution
		const request = new Request(this.site_url, {
			headers: {
				...this.headers,
				...headers
			},
			response_type: this.response_type,
			request_timeout: this.request_timeout,
			request_throttle_interval: this.request_throttle_interval,
			request_debounce_interval: this.request_debounce_interval,
			request_max_count: this.request_max_count,
			request_concurrency: this.request_concurrency
		});

		// Run request
		const { data } = await request.run({ url, method, body, headers });

		/**
		 * @description Handle expanded keys and their values
		 * @param {Array} items
		 * @returns {Array} Expanded items
		 */
		const handleExpandKeyValues = async (items = []) => {
			const expandedItemsData = await Promise.allSettled(
				items?.map(async (item = {}) => {
					try {
						// Shallow copy of the item
						let tempItem = { ...item };

						// Check if the item has an `contentLink.id` property
						if (!isEmpty(tempItem?.contentLink?.id)) {
							const { data: expandedItemData } = await request.run({ url: `${this.site_url + CONTENT_ENDPOINT + tempItem?.contentLink?.id + "?expand=*"}`, method: "get" });

							if (!isEmpty(expandedItemData)) {
								tempItem = { ...tempItem, ...expandedItemData };

								// Compare the expanded item with the original item
								if (!isEqual(tempItem, item)) {
									// If the item is expanded, display a success message
									console.info(`[EXPANDED] ${`${this.site_url + CONTENT_ENDPOINT + tempItem?.contentLink?.id + "?expand=*"}`}`);
								}
							}
						}

						// Return the expanded item
						return Promise.resolve(tempItem);
					} catch (err) {
						// Display error message
						console.error(`[ERROR] ${err?.message || convertObjectToString(err) || "An error occurred. Please try again later."}`);

						// Return the error
						return Promise.reject(err);
					}
				})
			)
				.then((res) => res?.filter((item) => item?.status === "fulfilled")?.map((item) => item?.value))
				.catch((err) => {
					// Display error message
					console.error(`[ERROR] ${err?.message || convertObjectToString(err) || "An error occurred. Please try again later."}`);

					// Return the error
					return err;
				});

			return expandedItemsData;
		};

		/**
		 * @description Handle expanded content blocks
		 * @param {Array} blocks
		 * @returns {Array} Expanded content blocks
		 */
		const handleExpandContentBlocks = async (blocks = []) => {
			const expandedBlocksData = await Promise.allSettled(
				blocks?.map(async (block = {}) => {
					try {
						// Shallow copy of the block
						let tempBlock = { ...block };

						// Check if the block has an expanded property
						if (!isEmpty(tempBlock?.contentLink?.expanded)) {
							const { dynamicStyles = null, items = null, images = null, form = null } = tempBlock.contentLink.expanded;

							// If the block has a `dynamicStyles` property, expand it
							if (isArrayType(dynamicStyles) && !isEmpty(dynamicStyles)) {
								const expandedDynamicStyles = await handleExpandKeyValues(dynamicStyles);

								tempBlock.contentLink.expanded.dynamicStyles = expandedDynamicStyles;

								// Compare the expanded block with the original block
								if (!isEqual(tempBlock.contentLink.expanded.dynamicStyles, expandedDynamicStyles)) {
									// If the block is expanded, display a success message
									console.info(`[EXPANDED] ${`${this.site_url + CONTENT_ENDPOINT + tempBlock?.contentLink?.id + "?expand=*"}`}`);
								}
							}

							// If the block has a `items` property, expand it
							if (isArrayType(items) && !isEmpty(items)) {
								const expandedItems = await handleExpandKeyValues(items);

								tempBlock.contentLink.expanded.items = expandedItems;

								// Compare the expanded block with the original block
								if (!isEqual(tempBlock.contentLink.expanded.items, expandedItems)) {
									// If the block is expanded, display a success message
									console.info(`[EXPANDED] ${`${this.site_url + CONTENT_ENDPOINT + tempBlock?.contentLink?.id + "?expand=*"}`}`);
								}
							}

							// If the block has a `images` property, expand it
							if (isArrayType(images) && !isEmpty(images)) {
								const expandedImages = await handleExpandKeyValues(images);

								tempBlock.contentLink.expanded.images = expandedImages;

								// Compare the expanded block with the original block
								if (!isEqual(tempBlock.contentLink.expanded.images, expandedImages)) {
									// If the block is expanded, display a success message
									console.info(`[EXPANDED] ${`${this.site_url + CONTENT_ENDPOINT + tempBlock?.contentLink?.id + "?expand=*"}`}`);
								}
							}

							// If the block has a `form` property, expand it
							if (isArrayType(form) && !isEmpty(form)) {
								const expandedForm = await handleExpandKeyValues(form);

								tempBlock.contentLink.expanded.form = expandedForm;

								// Compare the expanded block with the original block
								if (!isEqual(tempBlock.contentLink.expanded.form, expandedForm)) {
									// If the block is expanded, display a success message
									console.info(`[EXPANDED] ${`${this.site_url + CONTENT_ENDPOINT + tempBlock?.contentLink?.id + "?expand=*"}`}`);
								}
							}
						}

						// Return the expanded block
						return Promise.resolve(tempBlock);
					} catch (err) {
						// Display error message
						console.error(`[ERROR] ${err?.message || convertObjectToString(err) || "An error occurred. Please try again later."}`);

						// Return the error
						return Promise.reject(err);
					}
				})
			)
				.then((res) => res?.filter((item) => item?.status === "fulfilled")?.map((item) => item?.value))
				.catch((err) => {
					// Display error message
					console.error(`[ERROR] ${err?.message || convertObjectToString(err) || "An error occurred. Please try again later."}`);

					// Return the error
					return err;
				});

			return expandedBlocksData;
		};

		if ((isArrayType(data) || isObjectType(data)) && !isEmpty(data) && endpoint !== AUTH_ENDPOINT) {
			if (isArrayType(data)) {
				const expandedData = await Promise.allSettled(
					data?.map(async (item = {}) => {
						try {
							// Shallow copy of the item
							const tempItem = { ...item };

							// Check if the item has a content block properties
							const { contentBlocks = null, contentBlocksTop = null, contentBlocksBottom = null } = tempItem;

							// If the item has a content blocks property, fetch the content blocks data and expand its properties
							if (isArrayType(contentBlocks) && !isEmpty(contentBlocks)) {
								const expandedContentBlocks = await handleExpandContentBlocks(contentBlocks);

								// Update the content blocks property with the expanded data
								tempItem.contentBlocks = expandedContentBlocks;

								// Compare the expanded item with the original item
								if (!isEqual(tempItem.contentBlocks, expandedContentBlocks)) {
									// If the item is expanded, display a success message
									console.info(`[EXPANDED] ${`${this.site_url + CONTENT_ENDPOINT + tempItem?.contentLink?.id + "?expand=*"}`}`);
								}
							}

							// If the item has a content blocks top property, fetch the content blocks data and expand its properties
							if (isArrayType(contentBlocksTop) && !isEmpty(contentBlocksTop)) {
								const expandedContentBlocksTop = await handleExpandContentBlocks(contentBlocksTop);

								// Update the content blocks top property with the expanded data
								tempItem.contentBlocksTop = expandedContentBlocksTop;

								// Compare the expanded item with the original item
								if (!isEqual(tempItem.contentBlocksTop, expandedContentBlocksTop)) {
									// If the item is expanded, display a success message
									console.info(`[EXPANDED] ${`${this.site_url + CONTENT_ENDPOINT + tempItem?.contentLink?.id + "?expand=*"}`}`);
								}
							}

							// If the item has a content blocks bottom property, fetch the content blocks data and expand its properties
							if (isArrayType(contentBlocksBottom) && !isEmpty(contentBlocksBottom)) {
								const expandedContentBlocksBottom = await handleExpandContentBlocks(contentBlocksBottom);

								// Update the content blocks bottom property with the expanded data
								tempItem.contentBlocksBottom = expandedContentBlocksBottom;

								// Compare the expanded item with the original item
								if (!isEqual(tempItem.contentBlocksBottom, expandedContentBlocksBottom)) {
									// If the item is expanded, display a success message
									console.info(`[EXPANDED] ${`${this.site_url + CONTENT_ENDPOINT + tempItem?.contentLink?.id + "?expand=*"}`}`);
								}
							}

							// Return the expanded item
							return Promise.resolve(tempItem);
						} catch (err) {
							// Display error message
							console.error(`[ERROR] ${err?.message || convertObjectToString(err) || "An error occurred. Please try again later."}`);

							// Return the error
							return Promise.reject(err);
						}
					})
				)
					.then((res) => res?.filter((item) => item?.status === "fulfilled")?.map((item) => item?.value) || res)
					.catch((err) => err);

				return expandedData;
			} else {
				try {
					// Shallow copy of the item
					const tempItem = { ...data };

					// Check if the item has a content block properties
					const { contentBlocks = null, contentBlocksTop = null, contentBlocksBottom = null } = tempItem;

					// If the item has a content blocks property, fetch the content blocks data and expand its properties
					if (isArrayType(contentBlocks) && !isEmpty(contentBlocks)) {
						const expandedContentBlocks = await handleExpandContentBlocks(contentBlocks);

						// Update the content blocks property with the expanded data
						tempItem.contentBlocks = expandedContentBlocks;

						// Compare the expanded item with the original item
						if (!isEqual(tempItem.contentBlocks, expandedContentBlocks)) {
							// If the item is expanded, display a success message
							console.info(`[EXPANDED] ${`${this.site_url + CONTENT_ENDPOINT + tempItem?.contentLink?.id + "?expand=*"}`}`);
						}
					}

					// If the item has a content blocks top property, fetch the content blocks data and expand its properties
					if (isArrayType(contentBlocksTop) && !isEmpty(contentBlocksTop)) {
						const expandedContentBlocksTop = await handleExpandContentBlocks(contentBlocksTop);

						// Update the content blocks property with the expanded data
						tempItem.contentBlocksTop = expandedContentBlocksTop;

						// Compare the expanded item with the original item
						if (!isEqual(tempItem.contentBlocksTop, expandedContentBlocksTop)) {
							// If the item is expanded, display a success message
							console.info(`[EXPANDED] ${`${this.site_url + CONTENT_ENDPOINT + tempItem?.contentLink?.id + "?expand=*"}`}`);
						}
					}

					// If the item has a content blocks bottom property, fetch the content blocks data and expand its properties
					if (isArrayType(contentBlocksBottom) && !isEmpty(contentBlocksBottom)) {
						const expandedContentBlocksBottom = await handleExpandContentBlocks(contentBlocksBottom);

						// Update the content blocks property with the expanded data
						tempItem.contentBlocksBottom = expandedContentBlocksBottom;

						// Compare the expanded item with the original item
						if (!isEqual(tempItem.contentBlocksBottom, expandedContentBlocksBottom)) {
							// If the item is expanded, display a success message
							console.info(`[EXPANDED] ${`${this.site_url + CONTENT_ENDPOINT + tempItem?.contentLink?.id + "?expand=*"}`}`);
						}
					}

					// Return the expanded item
					return Promise.resolve(tempItem);
				} catch (err) {
					// Display error message
					console.error(`[ERROR] ${err?.message || convertObjectToString(err) || "An error occurred. Please try again later."}`);

					// Return the error
					return Promise.reject(err);
				}
			}
		} else return data;
	}

	/**
	 * @description Handle `GET` requests
	 * @param {String} url
	 * @param {Object} body
	 * @param {Object} headers
	 * @returns {Promise} Response promise
	 */
	async get({ url = null, body = null, headers = null, endpoint = null }) {
		const results = await this.request({ url, method: "get", body, headers, endpoint });

		return results;
	}

	/**
	 * @description Handle `POST` requests
	 * @param {String} url
	 * @param {Object} body
	 * @param {Object} headers
	 * @returns {Promise} Response promise
	 */
	async post({ url = null, body = null, headers = null, endpoint = null }) {
		const results = await this.request({ url, method: "post", body, headers, endpoint });

		return results;
	}

	/**
	 * @description Handle API authentication
	 * @returns {Promise} Response promise
	 */
	async authenticate() {
		let config = {
			url: this.site_url + REQUEST_URL_SLUG + AUTH_ENDPOINT,
			data: qs.stringify(
				{
					username: this.username,
					password: this.password,
					grant_type: this.grant_type,
					client_id: this.client_id
				},
				{ encode: false }
			),
			headers: {
				"Accept": REQUEST_ACCEPT_HEADER,
				"Content-Type": AUTH_REQUEST_CONTENT_TYPE_HEADER
			}
		};

		const results = await this.post({ url: config.url, body: config.data, headers: config.headers, endpoint: AUTH_ENDPOINT });

		return results;
	}
}
