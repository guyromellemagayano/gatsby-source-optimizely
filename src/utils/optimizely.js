"use strict";

import sleep from "then-sleep";
import { logger } from "./logger";
import Request from "./request";

class Optimizely {
	constructor(config) {
		if (!config) {
			throw new Error("Optimizely/Episerver API config required. It is required to make any call to the Optimizely/Episerver API");
		}

		this.site_url = config.site_url;
		this.username = config.username;
		this.password = config.password;
		this.grant_type = config.grant_type;
		this.client_id = config.client_id;
		this.response_type = config.response_type;
		this.headers = config.headers;
		this.log_level = config.log_level;
		this.request_timeout = config.request_timeout;
	}

	// Handle API requests
	async request(method, path, body = null) {
		// Prepare `path` for request execution
		const request = new Request(this.site_url, {
			username: this.username,
			password: this.password,
			grant_type: this.grant_type,
			client_id: this.client_id,
			headers: this.headers,
			response_type: this.response_type,
			log_level: this.log_level,
			request_timeout: this.request_timeout
		});

		let endpointUrl = new URL(path, this.site_url);

		logger.info(`[${method.toUpperCase()}] ${endpointUrl}`);

		const { data } = await request.run(method, path, body);

		// Return data
		return data;
	}

	// Handle `GET` request
	async get(path) {
		await sleep(this.request_timeout);

		const response = await this.request("get", path);
		return response;
	}

	// Handle `POST` request
	async post(path, body) {
		await sleep(this.request_timeout);

		const response = await this.request("post", path, body);
		return response;
	}
}

export default Optimizely;
