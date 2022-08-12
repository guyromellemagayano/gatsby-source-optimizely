"use strict";

import sleep from "then-sleep";
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
		await sleep(this.request_timeout);

		// Prepare `path` for request execution
		const request = new Request(this.site_url, {
			headers: Object.assign({}, this.headers, headers),
			response_type: this.response_type,
			log: this.log,
			request_timeout: this.request_timeout
		});

		// Run request
		const { data } = await request.run(method, path, body);

		// Return data
		return data;
	}

	// Handle `GET` request
	async get(path, headers = {}) {
		await sleep(this.request_timeout);

		const response = await this.request("get", path, headers);
		return response;
	}

	// Handle `POST` request
	async post(path, body, headers = {}) {
		await sleep(this.request_timeout);

		const response = await this.request("post", path, body, headers);
		return response;
	}
}

export default Optimizely;
