"use strict";

import qs from "qs";
import { AUTH_ENDPOINT, AUTH_REQUEST_CONTENT_TYPE_HEADER, CONTENT_ENDPOINT, REQUEST_ACCEPT_HEADER, REQUEST_URL_SLUG } from "../constants";
import { convertObjectToString } from "../utils/convertValues";
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
		this.reporter = config.reporter;
	}

	/**
	 * @description Handle API requests
	 * @param {String} url
	 * @param {String} method
	 * @param {Object} body
	 * @param {Object} headers
	 * @returns {Object} API response
	 */
	async request({ url, method = "", body, headers, endpoint }) {
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
		const { data } = await request.run({ url, method, body, headers, reporter: this.reporter });

		/**
		 * @description Handle expanded keys and their values
		 * @param {Array} items
		 * @returns {Array} Expanded items
		 */
		const handleExpandKeyValues = async (items) => {
			if (isArrayType(items)) {
				const promises = [];

				for (let i = 0; i < items.length; i++) {
					const item = Object.assign({}, items[i]);

					// Check if the item has an `contentLink.id` property
					if (item?.contentLink?.id) {
						promises.push(await request.run({ url: `${this.site_url + CONTENT_ENDPOINT + item.contentLink.id + "?expand=*"}`, method: "get", body, headers, reporter: this.reporter }));
					}
				}

				if (!isEmpty(promises)) {
					await Promise.allSettled(promises)
						.then((res) => {
							res
								?.filter((subItem) => subItem?.status === "fulfilled")
								?.map((subItem, index) => {
									const subItemData = subItem?.value?.data;

									// Update the item object with the data object
									items[index] = {
										...items[index],
										...subItemData
									};

									return items[index];
								});
						})
						.catch((err) => {
							this.reporter.error(`[ERROR] ${err?.message || convertObjectToString(err) || "There was an error while fetching and expanding items. Please try again later."}`);
							return Promise.reject(err);
						});
				}
			} else if (isObjectType(items)) {
				const promises = [];

				for (const [key, value] of Object.entries(items)) {
					// Check if the item has an `contentLink.id` property
					if (key === "id" && !isEmpty(value)) {
						promises.push(await request.run({ url: `${this.site_url + CONTENT_ENDPOINT + value + "?expand=*"}`, method: "get", body, headers, reporter: this.reporter }));
					}
				}

				if (!isEmpty(promises)) {
					await Promise.allSettled(promises)
						.then((res) => {
							res
								?.filter((subItem) => subItem?.status === "fulfilled")
								?.map((subItem) => {
									const subItemData = subItem?.value?.data;

									// Update the item object with the data object
									items = {
										...items,
										...subItemData
									};

									return items;
								});
						})
						.catch((err) => {
							this.reporter.error(`[ERROR] ${err?.message || convertObjectToString(err) || "There was an error while fetching and expanding items. Please try again later."}`);
							return Promise.reject(err);
						});
				}
			}

			return items;
		};

		/**
		 * @description Handle expanded content blocks
		 * @param {Array} blocks
		 * @returns {Array} Expanded content blocks
		 */
		const handleExpandContentBlocks = async (blocks) => {
			for (let i = 0; i < blocks.length; i++) {
				const block = Object.assign({}, blocks[i]);

				const blockImageElementArrays = ["images", "items", "productImages", "dynamicStyles"];
				const blockImageElementObjects = ["form", "image", "image1", "image2", "headerImage", "listImage", "secondaryListImage", "topImage", "secondary"];

				// Check block for available blockImageElementArrays
				await Promise.allSettled(
					blockImageElementArrays.map(async (element) => {
						if (!isEmpty(block?.contentLink?.expanded?.[element])) {
							block.contentLink.expanded[element] = await handleExpandKeyValues(block.contentLink.expanded[element]);
						}
					})
				);

				// Check block for available blockImageElementObjects
				await Promise.allSettled(
					blockImageElementObjects.map(async (element) => {
						if (!isEmpty(block?.contentLink?.expanded?.[element])) {
							block.contentLink.expanded[element] = await handleExpandKeyValues(block.contentLink.expanded[element]);
						}
					})
				);

				// Update the block with the expanded properties
				blocks[i] = block;
			}

			return blocks;
		};

		if (endpoint !== AUTH_ENDPOINT) {
			if (!isEmpty(data) && isArrayType(data)) {
				const expandedData = await Promise.allSettled(
					data.map(async (item) => {
						const temp = Object.assign({}, item);

						// If the item has a content blocks property, fetch the content blocks data and expand its properties
						if (!isEmpty(temp.contentBlocks)) {
							let expandedContentBlocks = await handleExpandContentBlocks(temp.contentBlocks);

							if (!isEmpty(expandedContentBlocks)) {
								// Update the content blocks property with the expanded data
								temp.contentBlocks = expandedContentBlocks;
							}
						}

						// If the item has a content blocks top property, fetch the content blocks data and expand its properties
						if (!isEmpty(temp.contentBlocksTop)) {
							let expandedContentBlocksTop = await handleExpandContentBlocks(temp.contentBlocksTop);

							if (!isEmpty(expandedContentBlocksTop)) {
								// Update the content blocks top property with the expanded data
								temp.contentBlocksTop = expandedContentBlocksTop;
							}
						}

						// If the item has a content blocks bottom property, fetch the content blocks data and expand its properties
						if (!isEmpty(temp.contentBlocksBottom)) {
							let expandedContentBlocksBottom = await handleExpandContentBlocks(temp.contentBlocksBottom);

							if (!isEmpty(expandedContentBlocksBottom)) {
								// Update the content blocks bottom property with the expanded data
								temp.contentBlocksBottom = expandedContentBlocksBottom;
							}
						}

						return temp;
					})
				)
					.then((res) => {
						const data = res?.filter((item) => item?.status === "fulfilled")?.map((item) => item?.value) || null;
						return Promise.resolve(data);
					})
					.catch((err) => {
						this.reporter.error(`[ERROR] ${err?.message || convertObjectToString(err) || "An error occurred while expanding the content blocks. Please try again later."}`);
						return err;
					});

				return expandedData;
			} else if (!isEmpty(data) && isObjectType(data)) {
				const temp = Object.assign({}, data);

				// If the item has a content blocks property, fetch the content blocks data and expand its properties
				if (!isEmpty(temp.contentBlocks)) {
					let expandedContentBlocks = await handleExpandContentBlocks(temp.contentBlocks);

					if (!isEmpty(expandedContentBlocks)) {
						// Update the content blocks property with the expanded data
						temp.contentBlocks = expandedContentBlocks;
					}
				}

				// If the item has a content blocks top property, fetch the content blocks data and expand its properties
				if (!isEmpty(temp.contentBlocksTop)) {
					let expandedContentBlocksTop = await handleExpandContentBlocks(temp.contentBlocksTop);

					if (!isEmpty(expandedContentBlocksTop)) {
						// Update the content blocks top property with the expanded data
						temp.contentBlocksTop = expandedContentBlocksTop;
					}
				}

				// If the item has a content blocks bottom property, fetch the content blocks data and expand its properties
				if (!isEmpty(temp.contentBlocksBottom)) {
					let expandedContentBlocksBottom = await handleExpandContentBlocks(temp.contentBlocksBottom);

					if (!isEmpty(expandedContentBlocksBottom)) {
						// Update the content blocks bottom property with the expanded data
						temp.contentBlocksBottom = expandedContentBlocksBottom;
					}
				}

				return temp;
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
	async get({ url, body, headers, endpoint }) {
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
	async post({ url, body, headers, endpoint }) {
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

		// TODO: Check and compare current time with the expiration time of the access token

		const results = await this.post({ url: config.url, body: config.data, headers: config.headers, endpoint: AUTH_ENDPOINT });

		return results;
	}
}
