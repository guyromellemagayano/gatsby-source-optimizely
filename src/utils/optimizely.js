/* eslint-disable prettier/prettier */
"use strict";

import sleep from "then-sleep";
import { CONTENT_ENDPOINT } from "../constants";
import Request from "./request";

class Optimizely {
	constructor(config) {
		if (!config) {
			throw new Error("Optimizely/Episerver API config required. It is required to make any call to the API");
		}

		this.site_url = config.site_url;
		this.response_type = config.response_type;
		this.headers = config.headers;
		this.log = config.log;
		this.request_timeout = config.request_timeout;
	}

	// Handle API requests
	async request(method, path, body = null, headers = {}) {
		//	await sleep(this.request_timeout);

		// Prepare `path` for request execution
		const request = new Request(this.site_url, {
			headers: Object.assign({}, this.headers, headers),
			response_type: this.response_type,
			log: this.log,
			request_timeout: this.request_timeout
		});

		// Run request
		const { data } = await request.run(method, path, body);

		// Handle expanded keys and values
		const handleExpandedKeyValues = async (values, label) => {
			if (values && Array.isArray(values) && values?.length > 0) {
				let promises = [];

				values.map(async (value) => {
					if (value && Object.prototype.hasOwnProperty.call(value, "contentLink") && Object.keys(value)?.length > 0) {
						if (value.contentLink.id) {
							promises.push(request.run("get", CONTENT_ENDPOINT + value.contentLink.id + "?expand=*", body));
						} else {
							let message = "Expanded `contentLink` in `" + label + "` is missing `id` key";

							throw message;
						}
					} else {
						let message = "Expanded `" + label + "` is missing `contentLink` key";

						throw message;
					}
				});

				await Promise.allSettled(promises)
					.then((res) => {
						if (res && Array.isArray(res) && res?.length > 0) {
							res
								.filter(({ status, value }) => status === "fulfilled" && value !== null)
								.map(({ value }, index) => {
									const { data } = value;

									values[index] = data;

									return values[index];
								});
						}

						return Promise.resolve(values);
					})
					.catch((err) => Promise.reject(err));
			} else if (values && Object.prototype.toString.call(values) === "[object Object]" && Object.keys(values)?.length > 0) {
				let promises = [];

				if (values && Object.prototype.hasOwnProperty.call(values, "id") && Object.keys(values)?.length > 0) {
					promises.push(request.run("get", CONTENT_ENDPOINT + values.id + "?expand=*", body));
				} else {
					let message = "Expanded `" + label + "` is missing `id` key";

					throw message;
				}

				await Promise.allSettled(promises)
					.then((res) => {
						if (res && Array.isArray(res) && res?.length > 0) {
							res
								.filter(({ status, value }) => status === "fulfilled" && value !== null)
								.map(({ value }) => {
									const { data } = value;

									values = data;

									return values;
								});
						}

						return Promise.resolve(values);
					})
					.catch((err) => Promise.reject(err));
			} else {
				this.log.warn("Current `" + label + "` is not an array, object or null. Skipping...");
			}

			return values;
		};

		// Handle content blocks
		const handleContentBlocks = async (blocks) => {
			const expandedBlocks = await Promise.allSettled(
				blocks.map(async (block) => {
					const temp = Object.assign({}, block);

					const dynamicStylesPromise =
						temp.contentLink?.expanded?.dynamicStyles && Array.isArray(temp.contentLink?.expanded?.dynamicStyles) && temp.contentLink?.expanded?.dynamicStyles?.length > 0
							? await handleExpandedKeyValues(temp.contentLink?.expanded?.dynamicStyles, "dynamicStyles")
							: null;
					const itemsPromise =
						temp.contentLink?.expanded?.items && Array.isArray(temp.contentLink?.expanded?.items) && temp.contentLink?.expanded?.items?.length > 0 ? await handleExpandedKeyValues(temp.contentLink?.expanded?.items, "items") : null;
					const imagesPromise =
						temp.contentLink?.expanded?.images && Array.isArray(temp.contentLink?.expanded?.images) && temp.contentLink?.expanded?.images?.length > 0 ? await handleExpandedKeyValues(temp.contentLink.expanded.images, "images") : null;
					const formPromise =
						temp.contentLink?.expanded?.form && Array.isArray(temp.contentLink?.expanded?.form) && temp.contentLink?.expanded?.form?.length > 0 ? await handleExpandedKeyValues(temp.contentLink?.expanded?.form, "form") : null;

					const expandedKeyValuesPromises = [dynamicStylesPromise, itemsPromise, imagesPromise, formPromise];

					await Promise.allSettled(expandedKeyValuesPromises)
						.then((res) => {
							if (res && Array.isArray(res) && res?.length > 0) {
								res
									.filter(({ status, value }) => status === "fulfilled" && value !== null)
									.map(({ value }, index) => {
										switch (index) {
											case 0: {
												delete temp.contentLink.expanded.dynamicStyles;
												temp.contentLink.expanded.dynamicStyles = value;
												break;
											}
											case 1: {
												delete temp.contentLink.expanded.items;
												temp.contentLink.expanded.items = value;
												break;
											}
											case 2: {
												delete temp.contentLink.expanded.images;
												temp.contentLink.expanded.images = value;
												break;
											}
											case 3: {
												delete temp.contentLink.expanded.form;
												temp.contentLink.expanded.form = value;
												break;
											}
											default:
												break;
										}

										return temp;
									});

								return Promise.resolve(temp);
							}
						})
						.catch((err) => {
							this.log.error(`An error occurred while fetching content blocks from the Optimizely/Episerver API`, err.message);

							return Promise.reject(err);
						});

					return temp;
				})
			)
				.then((res) => {
					if (res && Array.isArray(res) && res?.length > 0) {
						return Promise.resolve(res.filter(({ status, value }) => status === "fulfilled" && value !== null).map(({ value }) => value));
					}
				})
				.catch((err) => Promise.reject(err));

			return expandedBlocks;
		};

		// Handle expanded data
		if (data && Array.isArray(data) && data?.length > 0) {
			const expandedData = await Promise.allSettled(
				data.map(async (item) => {
					const temp = Object.assign({}, item);

					const { contentBlocks, contentBlocksTop, contentBlocksBottom } = temp;

					if (contentBlocks && Array.isArray(contentBlocks) && contentBlocks?.length > 0) {
						let expandedContentBlocks = await handleContentBlocks(contentBlocks);

						temp.contentBlocks = expandedContentBlocks;
					}

					if (contentBlocksTop && Array.isArray(contentBlocksTop) && contentBlocksTop?.length > 0) {
						let expandedContentBlocksTop = await handleContentBlocks(contentBlocksTop);

						temp.contentBlocksTop = expandedContentBlocksTop;
					}

					if (contentBlocksBottom && Array.isArray(contentBlocksBottom) && contentBlocksBottom?.length > 0) {
						let expandedContentBlocksBottom = await handleContentBlocks(contentBlocksBottom);

						temp.contentBlocksBottom = expandedContentBlocksBottom;
					}

					return temp;
				})
			)
				.then((res) => {
					if (res && Array.isArray(res) && res?.length > 0) {
						return Promise.resolve(res.filter(({ status, value }) => status === "fulfilled" && value !== null).map(({ value }) => value));
					}
				})
				.catch((err) => Promise.reject(err));

			return expandedData;
		} else if (data && Object.prototype.toString.call(data) === "[object Object]" && Object.keys(data)?.length > 0) {
			try {
				const expandedDataPromise = new Promise((resolve, reject) => {
					const temp = Object.assign({}, data);

					const { contentBlocks = null, contentBlocksTop = null, contentBlocksBottom = null } = temp;

					if (contentBlocks && Array.isArray(contentBlocks) && contentBlocks?.length > 0) {
						let expandedContentBlocks = handleContentBlocks(contentBlocks);

						temp.contentBlocks = expandedContentBlocks;
					}

					if (contentBlocksTop && Array.isArray(contentBlocksTop) && contentBlocksTop?.length > 0) {
						let expandedContentBlocksTop = handleContentBlocks(contentBlocksTop);

						temp.contentBlocksTop = expandedContentBlocksTop;
					}

					if (contentBlocksBottom && Array.isArray(contentBlocksBottom) && contentBlocksBottom?.length > 0) {
						let expandedContentBlocksBottom = handleContentBlocks(contentBlocksBottom);

						temp.contentBlocksBottom = expandedContentBlocksBottom;
					}

					return temp ? resolve(temp) : reject(temp);
				});

				return expandedDataPromise;
			} catch (err) {
				return Promise.reject(err);
			}
		} else return data;
	}

	// Handle `GET` request
	async get(path, headers = {}) {
		//await sleep(this.request_timeout);

		const response = await this.request("get", path, headers);
		return response;
	}

	// Handle `POST` request
	async post(path, body, headers = {}) {
		//await sleep(this.request_timeout);

		const response = await this.request("post", path, body, headers);
		return response;
	}
}

export default Optimizely;
