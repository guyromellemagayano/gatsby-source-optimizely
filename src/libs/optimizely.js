"use strict";

import qs from "qs";
import { AUTH_ENDPOINT, AUTH_REQUEST_CONTENT_TYPE_HEADER, CONTENT_ENDPOINT, REQUEST_ACCEPT_HEADER, REQUEST_URL_SLUG } from "../constants";
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
	 * @param {*} body
	 * @param {Object} headers
	 * @returns {Object} API response
	 */
	async request(url = "", method = "", body = null, headers = {}) {
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
			request_max_count: this.request_max_count
		});

		// Run request
		const { data } = await request.run(url, method, body, headers);

		/**
		 * @description Handle expanded keys and their values
		 * @param {Array} items
		 * @param {String} endpoint
		 * @returns {Array} Expanded items
		 */
		const handleExpandKeyValues = async (items = []) => {
			if (items && Array.isArray(items) && items?.length > 0) {
				const tempItems = { ...items };

				tempItems.map(async (item = {}) => {
					let tempItem = { ...item };

					if (typeof tempItem?.contentLink?.id === "number") {
						const { data: expandedData } = await request.run(`${this.site_url + CONTENT_ENDPOINT + tempItem.contentLink.id + "&expand=*"}`, "get");

						if (expandedData && Array.isArray(expandedData) && expandedData?.length > 0) {
							tempItem = { ...tempItem, ...expandedData[0] };
						}
					}

					return tempItem;
				});
			}

			return items;
		};

		/**
		 * @description Handle expanded content blocks
		 * @param {Array} blocks
		 * @param {String} endpoint
		 * @returns {Array} Expanded content blocks
		 */
		const handleExpandContentBlocks = async (blocks = []) => {
			if (blocks && Array.isArray(blocks) && blocks?.length > 0) {
				blocks.map(async (block = {}) => {
					// Shallow copy of the block
					let tempBlock = { ...block };

					// Block properties to be expanded
					const dynamicStylesPromise =
						tempBlock.contentLink?.expanded?.dynamicStyles && Array.isArray(tempBlock.contentLink?.expanded?.dynamicStyles) && tempBlock.contentLink?.expanded?.dynamicStyles?.length > 0
							? await handleExpandKeyValues(tempBlock.contentLink.expanded.dynamicStyles)
							: null;
					const itemsPromise =
						tempBlock.contentLink?.expanded?.items && Array.isArray(tempBlock.contentLink?.expanded?.items) && tempBlock.contentLink?.expanded?.items?.length > 0 ? await handleExpandKeyValues(tempBlock.contentLink.expanded.items) : null;
					const imagesPromise =
						tempBlock.contentLink?.expanded?.images && Array.isArray(tempBlock.contentLink?.expanded?.images) && tempBlock.contentLink?.expanded?.images?.length > 0
							? await handleExpandKeyValues(tempBlock.contentLink.expanded.images)
							: null;
					const formPromise =
						tempBlock.contentLink?.expanded?.form && Array.isArray(tempBlock.contentLink?.expanded?.form) && tempBlock.contentLink?.expanded?.form?.length > 0 ? await handleExpandKeyValues(tempBlock.contentLink.expanded.form) : null;

					const expandedKeyValuesPromises = [dynamicStylesPromise, itemsPromise, imagesPromise, formPromise];

					await Promise.allSettled(expandedKeyValuesPromises)
						.then((res) =>
							res && Array.isArray(res) && res?.length > 0
								? res
										.filter((item) => item?.status === "fulfilled")
										.map(async (item, index) => {
											switch (index) {
												case 0: {
													if (item?.value !== null) {
														await Promise.allSettled(item?.value)
															.then((res) => {
																// console.log(JSON.stringify(tempBlock.contentLink.expanded.dynamicStyles, null, 2), JSON.stringify(res, null, 2));
																return Promise.resolve(res);
															})
															.catch((err) => Promise.reject(err));
													}

													return;
												}
												case 1:
													tempBlock.contentLink.expanded.items = [...tempBlock.contentLink.expanded.items, ...item];
													break;
												case 2:
													tempBlock.contentLink.expanded.images = [...tempBlock.contentLink.expanded.images, ...item];
													break;
												case 3:
													tempBlock.contentLink.expanded.form = [...tempBlock.contentLink.expanded.form, ...item];
													break;
												default:
													break;
											}

											return Promise.resolve(tempBlock);
										})
								: null
						)
						.catch((err) => Promise.reject(err));

					return tempBlock;
				});
			}

			return blocks;
		};

		if (data && Array.isArray(data) && data?.length > 0) {
			const expandedData = await Promise.allSettled(
				data.map(async (item) => {
					// Shallow copy of the item
					const tempItem = { ...item };

					// Check if the item has a content block properties
					const { contentBlocks = null, contentBlocksTop = null, contentBlocksBottom = null } = tempItem;

					// If the item has a content blocks property, fetch the content blocks data and expand its properties
					if (contentBlocks && Array.isArray(contentBlocks) && contentBlocks?.length > 0) {
						const expandedContentBlocks = await handleExpandContentBlocks(contentBlocks);

						// Update the content blocks property with the expanded data
						tempItem.contentBlocks = expandedContentBlocks;
					}

					// If the item has a content blocks top property, fetch the content blocks data and expand its properties
					if (contentBlocksTop && Array.isArray(contentBlocksTop) && contentBlocksTop?.length > 0) {
						const expandedContentBlocksTop = await handleExpandContentBlocks(contentBlocksTop);

						// Update the content blocks top property with the expanded data
						tempItem.contentBlocksTop = expandedContentBlocksTop;
					}

					// If the item has a content blocks bottom property, fetch the content blocks data and expand its properties
					if (contentBlocksBottom && Array.isArray(contentBlocksBottom) && contentBlocksBottom?.length > 0) {
						const expandedContentBlocksBottom = await handleExpandContentBlocks(contentBlocksBottom);

						// Update the content blocks bottom property with the expanded data
						tempItem.contentBlocksBottom = expandedContentBlocksBottom;
					}

					return tempItem;
				})
			)
				.then((res) => Promise.resolve(res?.filter((item) => item?.status === "fulfilled")?.map((item) => item?.value)))
				.catch((err) => Promise.reject(err));

			return expandedData;
		} else if (data && Object.prototype.toString.call(data) === "[object Object]" && Object.keys(data).length > 0) {
			try {
				const expandedDataPromise = new Promise((resolve, reject) => {
					// Shallow copy of the item
					const tempItem = { ...data };

					// Check if the item has a content block properties
					const { contentBlocks = null, contentBlocksTop = null, contentBlocksBottom = null } = tempItem;

					// If the item has a content blocks property, fetch the content blocks data and expand its properties
					if (contentBlocks && Array.isArray(contentBlocks) && contentBlocks?.length > 0) {
						const expandedContentBlocks = handleExpandContentBlocks(contentBlocks);

						// Update the content blocks property with the expanded data
						tempItem.contentBlocks = expandedContentBlocks;
					}

					// If the item has a content blocks top property, fetch the content blocks data and expand its properties
					if (contentBlocksTop && Array.isArray(contentBlocksTop) && contentBlocksTop?.length > 0) {
						const expandedContentBlocksTop = handleExpandContentBlocks(contentBlocksTop);

						// Update the content blocks property with the expanded data
						tempItem.contentBlocksTop = expandedContentBlocksTop;
					}

					// If the item has a content blocks bottom property, fetch the content blocks data and expand its properties
					if (contentBlocksBottom && Array.isArray(contentBlocksBottom) && contentBlocksBottom?.length > 0) {
						const expandedContentBlocksBottom = handleExpandContentBlocks(contentBlocksBottom);

						// Update the content blocks property with the expanded data
						tempItem.contentBlocksBottom = expandedContentBlocksBottom;
					}

					return tempItem ? resolve(tempItem) : reject(tempItem);
				});

				return expandedDataPromise;
			} catch (err) {
				return Promise.reject(err);
			}
		} else return data;
	}

	/**
	 * @description Handle `GET` requests
	 * @param {String} url
	 * @param {*} body
	 * @param {Object} headers
	 * @returns {Promise} Response promise
	 */
	async get({ url = "", body = null, headers = {} }) {
		await this.request(url, "get", body, headers)
			.then((res) => res)
			.catch((err) => err);
	}

	/**
	 * @description Handle `POST` requests
	 * @param {String} url
	 * @param {*} body
	 * @param {Object} headers
	 * @returns {Promise} Response promise
	 */
	async post({ url = "", body = null, headers = {} }) {
		await this.request(url, "post", body, headers)
			.then((res) => res)
			.catch((err) => err);
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

		await this.post({ url: config.url, body: config.data, headers: config.headers });
	}
}

export default Optimizely;
