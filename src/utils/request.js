"use strict";

import axios from "axios";
import { OPTIMIZELY_AUTH_ENDPOINT, REQUEST_ACCEPT_HEADER, REQUEST_TIMEOUT, REQUEST_URL_SLUG } from "../constants";

class Request {
	constructor(hostname, username, password, grant_type, client_id, headers) {
		this.hostname = hostname;
		this.username = username;
		this.password = password;
		this.grant_type = grant_type;
		this.client_id = client_id;
		this.headers = headers;
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
			withCredentials: true,
			timeout: REQUEST_TIMEOUT
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
			(err) => Promise.reject(err)
		);

		// Handle `GET` request
		const getMethod = async (endpoint) =>
			await RequestAxiosInstance.get(endpoint)
				.then((res) => res.data)
				.catch((err) => err);

		// Handle `POST` request
		const postMethod = async (endpoint, body) =>
			await RequestAxiosInstance.post(endpoint, body)
				.then((res) => res.data)
				.catch((err) => err);

		switch (method) {
			case "GET":
				return getMethod(path);
			case "POST":
				return postMethod(path, body);
			default:
				throw new Error(`The method ${method} is not supported.`);
		}
	}
}

export default Request;
