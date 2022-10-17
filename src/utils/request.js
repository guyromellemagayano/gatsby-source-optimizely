"use strict";

import axios from "axios";
import { REQUEST_ACCEPT_HEADER, REQUEST_MAX_COUNT, REQUEST_THROTTLE_INTERVAL, REQUEST_URL_SLUG } from "../constants";
import { convertStringToUppercase } from "./convertValues";

export class Request {
	constructor(hostname, { headers, response_type, log, request_timeout } = {}) {
		this.hostname = hostname;
		this.headers = headers;
		this.response_type = response_type;
		this.log = log;
		this.request_timeout = request_timeout;
		this.pending_requests = 0;
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
					this.log.warn(`[${method.toUpperCase()}] ${this.hostname + path} - Request sent`);

					let requestInterval = setInterval(() => {
						if (this.pending_requests < REQUEST_MAX_COUNT) {
							this.pending_requests++;
							clearInterval(requestInterval);
							resolve(config);
						}
					}, REQUEST_THROTTLE_INTERVAL);
				})
		);

		// Use `axios` interceptors for all HTTP methods (GET, POST, PUT, DELETE, etc.)
		RequestAxiosInstance.interceptors.response.use(
			(res) => {
				// Send log message when endpoint request is successful
				this.log.info(
					`[${convertStringToUppercase(method)}] ${this.hostname + path} (${res.status + " " + res.statusText}) - ${
						res && Array.isArray(res) && res.length > 0 ? res.length : res && Object.prototype.toString.call(res) === "[object Object]" && Object.keys(res).length > 0 ? Object.keys(res).length : 0
					} items found`
				);

				// Decrement pending requests
				this.pending_requests = Math.max(0, this.pending_requests - 1);

				return Promise.resolve(res);
			},
			(err) => {
				if (err.response) {
					// Send log message when error response is received
					this.log.error(`[${convertStringToUppercase(method)}] ${this.hostname + path} (${err.response.status + " " + err.response.statusText}). Restarting request...`);
				} else if (err.request) {
					// Send log message when error request is received
					this.log.error(`[${convertStringToUppercase(method)}] ${this.hostname + path} (${err.request.status + " " + err.request.statusText}). Restarting request...`);
				} else {
					// Send log message when error is thrown
					this.log.error(`[${convertStringToUppercase(method)}] ${this.hostname + path} - ${err.message}`);
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
					.then(({ data }) => data)
					.catch((err) => err);

				return result;
			}
			case "post": {
				const result = await RequestAxiosInstance.post(path, body)
					.then(({ data }) => data)
					.catch((err) => err);

				return result;
			}
			default:
				throw new Error(`The ${updatedMethod} method is currently not supported.`);
		}
	}
}

export default Request;
