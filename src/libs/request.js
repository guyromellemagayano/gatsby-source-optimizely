"use strict";

import axios from "axios";
import * as https from "https";
import { REQUEST_CONCURRENCY, REQUEST_DEBOUNCE_INTERVAL, REQUEST_PENDING_COUNT, REQUEST_THROTTLE_INTERVAL, REQUEST_TIMEOUT } from "../constants";
import { convertObjectToString, convertStringToLowercase, convertStringToUppercase } from "../utils/convertValues";
import { debounce } from "../utils/debounce";
import { throttle } from "../utils/throttle";

export class Request {
	constructor(
		hostname,
		{ headers = null, response_type = null, request_timeout = REQUEST_TIMEOUT, request_throttle_interval = REQUEST_THROTTLE_INTERVAL, request_debounce_interval = REQUEST_DEBOUNCE_INTERVAL, request_concurrency = REQUEST_CONCURRENCY } = {}
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

	/**
	 * @description Handle running API requests
	 * @param {String} url
	 * @param {String} method
	 * @param {Object} body
	 * @param {Object} headers
	 */
	async run({ url = null, method = null, body = null, headers = null }) {
		const updatedMethod = convertStringToLowercase(method);

		let config = {
			headers: {
				...this.headers,
				...headers
			},
			responseType: this.response_type,
			withCredentials: true,
			timeout: this.request_timeout,
			httpsAgent: new https.Agent({ keepAlive: true })
		};

		// Custom `request` instance
		const RequestAxiosInstance = axios.create(config);

		// Use `axios` interceptors for all HTTP methods (GET, POST, PUT, DELETE, etc.)
		RequestAxiosInstance.interceptors.request.use((config) => {
			// Debounce requests to avoid rate limiting
			let debounceInterval = debounce(() => this.pending_requests--, this.request_debounce_interval);

			// Throttle requests to avoid rate limiting
			let throttleInterval = throttle(() => {
				clearInterval(throttleInterval);
				debounceInterval();

				return config;
			}, this.request_throttle_interval);

			if (this.pending_requests <= this.request_concurrency) {
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
		}),
			(res) => {
				// Send info message to console if request is successful
				console.info(`[${convertStringToUppercase(method)}] ${url} - (${res?.status} ${res?.statusText})`);

				// Return response
				return res;
			},
			(err) => {
				// Send error message to console if request fails
				console.error(`[${convertStringToUppercase(method)}] ${url} - (ERROR)`);
				console.error("\n", err.message, "\n");

				// Return error message
				return err;
			};

		// Use `axios` interceptors for all HTTP methods (GET, POST, PUT, DELETE, etc.)
		RequestAxiosInstance.interceptors.response.use((res) => {
			// Decrement pending requests
			this.pending_requests = Math.max(0, this.pending_requests > 0 ? this.pending_requests - 1 : 0);

			// Send info message to console if request is successful
			console.info(
				`[${convertStringToUppercase(method)}] ${url} - (${res?.status} ${res?.statusText}) - (${res?.data?.length || Object.keys(res?.data)?.length || 0} ${
					res?.data?.length === 1 || Object.keys(res?.data)?.length === 1 ? "item" : "items"
				}) - (${this.pending_requests} pending ${this.pending_requests > 1 ? "requests" : "request"})`
			);

			// Return response
			return res;
		}),
			(err) => {
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
					console.error("\n", `${err?.message || convertObjectToString(err) || "An error occurred. Please try again later."}`, "\n");
				}

				// Return error message
				return err;
			};

		switch (updatedMethod) {
			case "get": {
				const results = await RequestAxiosInstance.get(url, body)
					.then((res) => res)
					.catch((err) => err);

				return results;
			}
			case "post": {
				const results = await RequestAxiosInstance.post(url, body)
					.then((res) => res)
					.catch((err) => err);

				return results;
			}
			default:
				throw new Error(`The ${updatedMethod} method is currently not supported.`);
		}
	}
}
