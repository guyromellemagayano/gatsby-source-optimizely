"use strict";

import axios from "axios";
import { OPTIMIZELY_AUTH_ENDPOINT, REQUEST_ACCEPT_HEADER, REQUEST_TIMEOUT, REQUEST_URL_SLUG } from "../constants";
import { logger } from "./logger";

class Request {
	constructor(hostname, { username = null, password = null, grant_type = "password", client_id = "default", headers = {}, response_type = "json", log_level = "debug", request_timeout = REQUEST_TIMEOUT } = {}) {
		this.hostname = hostname;
		this.username = username;
		this.password = password;
		this.grant_type = grant_type;
		this.client_id = client_id;
		this.headers = headers;
		this.response_type = response_type;
		this.log_level = log_level;
		this.request_timeout = request_timeout;
	}

	// FIXME: Handle authentication request
	async authenticate(query) {
		// Prepare `body` for request execution
		const body = {
			username: this.username,
			password: this.password,
			grant_type: this.grant_type,
			client_id: this.client_id,
			...query
		};

		// Handle `POST` request
		const response = await this.post(OPTIMIZELY_AUTH_ENDPOINT, body);

		return response;
	}

	// Handle running plugin
	async run(method, path, body) {
		// Custom `axios` instance
		const RequestAxiosInstance = axios.create({
			baseURL: this.hostname + REQUEST_URL_SLUG,
			headers: this.headers,
			responseType: this.response_type,
			withCredentials: true,
			timeout: this.request_timeout
		});

		// Override default `axios` instance
		axios.defaults.headers.common["Accept"] = REQUEST_ACCEPT_HEADER;
		axios.defaults.headers.common["Content-Type"] = REQUEST_ACCEPT_HEADER;

		// Use `axios` interceptors for all HTTP methods (GET, POST, PUT, DELETE, etc.)
		RequestAxiosInstance.interceptors.request.use(
			(req) => Promise.resolve(req),
			(err) => Promise.reject(err)
		);

		// Use `axios` interceptors for all HTTP methods (GET, POST, PUT, DELETE, etc.)
		RequestAxiosInstance.interceptors.response.use(
			(req) => Promise.resolve(req),
			(err) => {
				logger.error(`[${method.toUpperCase()}] ${this.hostname + path} ${err.response ? err.response.status : err.message}`);

				return Promise.reject(err);
			}
		);

		switch (method) {
			case "get":
				return await RequestAxiosInstance.get(path)
					.then((res) => Promise.resolve(res))
					.catch((err) => Promise.reject(err));
			case "post":
				return await RequestAxiosInstance.post(path, body)
					.then((res) => Promise.resolve(res))
					.catch((err) => Promise.reject(err));
			default:
				throw new Error(`The method ${method} is not supported.`);
		}
	}
}

export default Request;
