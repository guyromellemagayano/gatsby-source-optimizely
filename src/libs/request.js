"use strict";

import axios from "axios";
import { REQUEST_ACCEPT_HEADER, REQUEST_CONCURRENCY, REQUEST_DEBOUNCE_INTERVAL, REQUEST_PENDING_COUNT, REQUEST_THROTTLE_INTERVAL, REQUEST_TIMEOUT } from "../constants";
import { convertStringToLowercase, convertStringToUppercase } from "../utils/convertValues";
import { debounce } from "../utils/debounce";
import { throttle } from "../utils/throttle";

export class Request {
	constructor(
		hostname,
		{ headers = {}, response_type = "", request_timeout = REQUEST_TIMEOUT, request_throttle_interval = REQUEST_THROTTLE_INTERVAL, request_debounce_interval = REQUEST_DEBOUNCE_INTERVAL, request_concurrency = REQUEST_CONCURRENCY } = {}
	) {
		this.hostname = hostname;
		this.response_type = response_type;
		this.headers = headers;
		this.pending_requests = REQUEST_PENDING_COUNT;
		this.request_timeout = request_timeout;
		this.request_throttle_interval = request_throttle_interval;
		this.request_debounce_interval = request_debounce_interval;
		this.request_concurrency = request_concurrency;
	}

	// Handle running plugin
	async run(url = "", method = "", body = null, headers = {}) {
		const updatedMethod = convertStringToLowercase(method);

		let config = {
			headers: {
				...this.headers,
				...headers
			},
			responseType: this.response_type,
			withCredentials: true,
			timeout: this.request_timeout
		};

		// Override default `axios` instance
		axios.defaults.headers.common["Accept"] = REQUEST_ACCEPT_HEADER;
		axios.defaults.headers.common["Content-Type"] = REQUEST_ACCEPT_HEADER;

		console.log(config);

		// Custom `request` instance
		const RequestAxiosInstance = axios.create(config);

		// Use `axios` interceptors for all HTTP methods (GET, POST, PUT, DELETE, etc.)
		RequestAxiosInstance.interceptors.request.use(
			(config) =>
				new Promise((resolve) => {
					// Debounce requests to avoid rate limiting
					let debounceInterval = debounce(() => this.pending_requests--, this.request_debounce_interval);

					// Throttle requests to avoid rate limiting
					let throttleInterval = throttle(() => {
						clearInterval(throttleInterval);
						debounceInterval();
						resolve(config);
					}, this.request_throttle_interval);

					if (this.pending_requests <= this.request_concurrency) {
						console.warn(`[${convertStringToUppercase(method)}] ${url} - (SENT)`);

						// Wait for all throttle to clear
						throttleInterval();
					}

					if (this.pending_requests > this.request_concurrency) {
						// Return null if there are too many pending requests
						console.warn(`[${convertStringToUppercase(method)}] ${url} - (THROTTLED) (${this.pending_requests} pending ${this.pending_requests > 1 ? "requests" : "request"})`);
					}

					// Increment pending requests
					this.pending_requests++;

					return config;
				})
		),
			(res) =>
				new Promise((resolve) => {
					// Send info message to console if request is successful
					console.info(`[${convertStringToUppercase(method)}] ${url} - (${res.status} ${res.statusText})`);
					resolve(res);

					// Return response
					return res;
				}),
			(err) =>
				new Promise((reject) => {
					// Send error message to console if request fails
					console.error(`[${convertStringToUppercase(method)}] ${url} - (ERROR)`);
					console.error("\n", err.message, "\n");
					reject(err);

					// Return error message
					return err;
				});

		// Use `axios` interceptors for all HTTP methods (GET, POST, PUT, DELETE, etc.)
		RequestAxiosInstance.interceptors.response.use(
			(res) =>
				new Promise((resolve) => {
					// Decrement pending requests
					this.pending_requests = Math.max(0, this.pending_requests > 0 ? this.pending_requests - 1 : 0);

					// Send info message to console if request is successful
					console.info(`[${convertStringToUppercase(method)}] ${url} - (${res.status} ${res.statusText}) (${this.pending_requests} pending ${this.pending_requests > 1 ? "requests" : "request"})`);

					// Return response
					return resolve(res);
				})
		),
			(err) =>
				new Promise((reject) => {
					if (err.response) {
						// Decrement pending requests
						this.pending_requests = Math.max(0, this.pending_requests > 0 ? this.pending_requests - 1 : 0);

						// Send log message when error response is received
						console.error(`[${convertStringToUppercase(method)}] ${url} - (${err.response.status} ${err.response.statusText})`);
					} else if (err.request) {
						// Decrement pending requests
						this.pending_requests = Math.max(0, this.pending_requests > 0 ? this.pending_requests - 1 : 0);

						// Send log message when error request is received
						console.error(`[${convertStringToUppercase(method)}] ${url} - (${err.request.status} ${err.request.statusText})`);
					} else {
						// Send log message when error is thrown
						console.error(`[${convertStringToUppercase(method)}] ${url} - (ERROR)`);
						console.error("\n", err.message, "\n");
					}

					// Return error message
					return reject(err);
				});

		switch (updatedMethod) {
			case "get":
				await RequestAxiosInstance.get(url, body);
				break;
			case "post":
				await RequestAxiosInstance.post(url, body);
				break;
			default:
				throw new Error(`The ${updatedMethod} method is currently not supported.`);
		}
	}
}
