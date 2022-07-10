"use strict";

import Request from "./request";

class Optimizely {
	constructor(config) {
		if (!config) throw new Error("\n[FAIL] Config missing. The config object is required to make any call to the Optimizely API");

		this.site_url = config.site_url;
		this.username = config.username;
		this.password = config.password;
		this.grant_type = config.grant_type;
		this.client_id = config.client_id;
		this.headers = config.headers;
	}

	// Handle API requests
	async request(method, path, body = null) {
		// Prepare `path` for request execution
		const request = new Request(this.site_url, this.username, this.password, this.grant_type, this.client_id, this.headers);
		const response = await request.run(method, path, body);

		return response;
	}

	// Handle `GET` request
	async get(path) {
		const response = await this.request("GET", path);

		return response;
	}

	// Handle `POST` request
	async post(path, body) {
		const response = await this.request("POST", path, body);

		return response;
	}
}

export default Optimizely;
