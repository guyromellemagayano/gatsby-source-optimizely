"use strict";

import axios from "axios";
import { REQUEST_ACCEPT_HEADER, REQUEST_MAX_COUNT, REQUEST_URL_SLUG } from "../constants";
import { convertStringToUppercase } from "./convertValues";

export class Request {
	constructor(hostname, { headers, response_type, log, request_timeout, request_throttle_interval } = {}) {
		this.hostname = hostname;
		this.headers = headers;
		this.response_type = response_type;
		this.log = log;
		this.request_timeout = request_timeout;
		this.pending_requests = 0;
		this.request_throttle_interval = request_throttle_interval;
	}

	/**
	 * @description Handle plugin requests to the Optimizely/Episerver site, return the response data, or throw an error
	 * @param {String} method
	 * @param {String} path
	 * @param {Object} body
	 * @returns {Object} data
	 */
	async run(method, path, body) {
		// Custom `request` instance
		const RequestAxiosInstance = axios.create({
			baseURL: this.hostname + REQUEST_URL_SLUG,
			headers: this.headers,
			responseType: this.response_type,
			withCredentials: true,
			timeout: this.request_timeout
		});

		// Override default `axios` instance
		axios.defaults.headers.common["Accept"] = REQUEST_ACCEPT_HEADER;

		// Use `axios` interceptors for all HTTP methods (GET, POST, PUT, DELETE, etc.)
		RequestAxiosInstance.interceptors.request.use(
			(config) =>
				new Promise((resolve) => {
					this.log.warn(`[${method.toUpperCase()}] ${this.hostname + REQUEST_URL_SLUG + path} - Request sent`);

					let requestInterval = setInterval(() => {
						if (this.pending_requests < REQUEST_MAX_COUNT) {
							this.pending_requests++;
							clearInterval(requestInterval);
							resolve(config);
						}
					}, this.request_throttle_interval);
				}),
			(res) => {
				this.log.info(`[${method.toUpperCase()}] ${this.hostname + REQUEST_URL_SLUG + path} - Response received`);
				return Promise.resolve(res);
			},
			(err) => {
				this.log.error(`[${method.toUpperCase()}] ${this.hostname + REQUEST_URL_SLUG + path} - Request failed`);
				return Promise.reject(err);
			}
		);

		// Use `axios` interceptors for all HTTP methods (GET, POST, PUT, DELETE, etc.)
		RequestAxiosInstance.interceptors.response.use(
			(res) => {
				// Send log message when endpoint request is successful
				this.log.info(`[${convertStringToUppercase(method)}] ${this.hostname + REQUEST_URL_SLUG + path} (${res.status + " " + res.statusText})`);

				// Decrement pending requests
				this.pending_requests = Math.max(0, this.pending_requests - 1);

				return Promise.resolve(res);
			},
			async (err) => {
				if (err.response) {
					// Send log message when error response is received
					this.log.error(`[${convertStringToUppercase(method)}] ${this.hostname + REQUEST_URL_SLUG + path} - Restarting request...`);

					await this.run(method, path, body);
				} else if (err.request) {
					// Send log message when error request is received
					this.log.error(`[${convertStringToUppercase(method)}] ${this.hostname + REQUEST_URL_SLUG + path} - Restarting request...`);

					await this.run(method, path, body);
				} else {
					// Send log message when error is thrown
					this.log.error(`[${convertStringToUppercase(method)}] ${this.hostname + REQUEST_URL_SLUG + path} - ${err.message}`);
				}

				// Decrement pending requests
				this.pending_requests = Math.max(0, this.pending_requests - 1);

				return Promise.reject(err);
			}
		);

		const updatedMethod = method.toLowerCase();

		switch (updatedMethod) {
			case "get": {
				const result = await RequestAxiosInstance.get(path, body)
					.then((res) => res)
					.catch((err) => err);

				return result;
			}
			case "post": {
				const result = await RequestAxiosInstance.post(path, body)
					.then((res) => res)
					.catch((err) => err);

				return result;
			}
			default:
				throw new Error(`The ${updatedMethod} method is currently not supported.`);
		}
	}
}

export default Request;
