/* eslint-disable prettier/prettier */
"use strict";

import axios from "axios";
import { REQUEST_ACCEPT_HEADER, REQUEST_MAX_COUNT, REQUEST_URL_SLUG } from "../constants";
import { convertStringToLowercase, convertStringToUppercase } from "./convertValues";
import { debounce } from "./debounce";

export class Optimizely {
	constructor(config) {
		if (!config) {
			throw new Error("Optimizely/Episerver API config required. It is required to make any call to the API");
		}

		this.site_url = config.site_url + REQUEST_URL_SLUG;
		this.response_type = config.response_type;
		this.headers = config.headers;
		this.pending_requests = 0;
		this.request_timeout = config.request_timeout;
		this.request_throttle_interval = config.request_throttle_interval;
		this.request_debounce_interval = config.request_debounce_interval;
	}

	async request(url = null, nodeName = null, method = null, body = null, headers = null) {
		const updatedUrl = this.site_url + url;

		const RequestAxiosInstance = axios.create({
			baseURL: this.site_url,
			headers: Object.assign({}, this.headers, headers),
			responseType: this.response_type,
			withCredentials: true,
			timeout: this.request_timeout
		});

		RequestAxiosInstance.defaults.headers.common["Accept"] = REQUEST_ACCEPT_HEADER;

		RequestAxiosInstance.interceptors.request.use(
			(config) =>
				new Promise((resolve) => {
					// Send request log message to console
					console.warn(`[${convertStringToUppercase(method)}] ${updatedUrl} - ${nodeName} - (SENT)`);

					// Debounce requests to avoid rate limiting
					let debounceInterval = debounce(() => this.pending_requests--, this.request_debounce_interval);

					// Throttle requests to avoid rate limiting
					let throttleInterval = setInterval(() => {
						if (this.pending_requests < REQUEST_MAX_COUNT) {
							clearInterval(throttleInterval);
							debounceInterval();
							resolve(config);
						}
					}, this.request_throttle_interval);

					// Wait for all throttle to clear
					throttleInterval;

					// Return null if there are too many pending requests
					if (this.pending_requests > REQUEST_MAX_COUNT) {
						console.error(`[${convertStringToUppercase(method)}] ${updatedUrl} - ${nodeName} - (THROTTLED)`);
						resolve(null);
					}

					return config;
				}),
			(res) => Promise.resolve(res),
			(err) => Promise.reject(err)
		);

		RequestAxiosInstance.interceptors.response.use(
			(res) => {
				// Send log message when endpoint request is successful
				console.info(`[${convertStringToUppercase(method)}] ${updatedUrl} - ${nodeName} - (${res.statusText})`);

				// Decrement pending requests
				this.pending_requests = Math.max(0, this.pending_requests - 1);

				return res;
			},
			async (err) => {
				if (err.response) {
					// Send log message when error response is received
					console.error(`[${convertStringToUppercase(method)}] ${updatedUrl} - ${nodeName} - [ERROR] (${err.message})`);

					// Death by rate limit is self enforced
					await this.request(url, method, body, headers);
				} else if (err.request) {
					// Send log message when error request is received
					console.error(`[${convertStringToUppercase(method)}] ${updatedUrl} - ${nodeName} - [ERROR] (${err.message})`);

					// Death by rate limit is self enforced
					await this.request(url, method, body, headers);
				} else {
					// Send log message when error is thrown
					console.error(`[${convertStringToUppercase(method)}] ${updatedUrl} - ${nodeName} - [ERROR] (${err.message})`);
				}

				// Decrement pending requests
				this.pending_requests = Math.max(0, this.pending_requests - 1);

				return Promise.reject(err);
			}
		);

		const updatedMethod = convertStringToLowercase(method);

		switch (updatedMethod) {
			case "get": {
				const response = await RequestAxiosInstance.get(url, body)
					.then((res) => Promise.resolve(res?.data || null))
					.catch((err) => Promise.reject(err));
				return response;
			}
			case "post": {
				const response = await RequestAxiosInstance.post(url, body)
					.then((res) => Promise.resolve(res?.data || null))
					.catch((err) => Promise.reject(err));
				return response;
			}
			default:
				throw new Error(`The ${updatedMethod} method is currently not supported.`);
		}
	}
}

export default Optimizely;
