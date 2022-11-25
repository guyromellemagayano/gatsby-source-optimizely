/* eslint-disable prettier/prettier */
"use strict";

import axios from "axios";
import { REQUEST_ACCEPT_HEADER, REQUEST_MAX_COUNT, REQUEST_URL_SLUG } from "../constants";
import { convertStringToLowercase, convertStringToUppercase } from "./convertValues";
import { debounce } from "./debounce";
import { throttle } from "./throttle";

export class Optimizely {
	constructor(config) {
		if (!config) {
			throw new Error("Optimizely/Episerver API config required. It is required to make any call to the API");
		}

		this.site_url = config.site_url + REQUEST_URL_SLUG;
		this.response_type = config.response_type;
		this.headers = config.headers;
		this.log = config.log;
		this.pending_requests = 0;
		this.request_timeout = config.request_timeout;
		this.request_throttle_interval = config.request_throttle_interval;
		this.request_debounce_interval = config.request_debounce_interval;
	}

	async request(url = null, method = null, body = null, headers = null) {
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
					this.log.warn(`[${convertStringToUppercase(method)}] ${updatedUrl} - Request sent`);

					// Debounce requests to avoid rate limiting
					let debounceInterval = debounce(() => this.pending_requests--, this.request_debounce_interval);

					// Throttle requests to avoid rate limiting
					let throttleInterval = throttle(() => {
						if (this.pending_requests < REQUEST_MAX_COUNT) {
							this.pending_requests++;
							clearInterval(throttleInterval);
							resolve(config);
						}
					}, this.request_throttle_interval);

					// Do not overly throttle requests
					debounceInterval();

					// Wait for all throttle to clear
					throttleInterval();

					// Return null if there are too many pending requests
					if (this.pending_requests > REQUEST_MAX_COUNT) {
						this.log.error(`[${convertStringToUppercase(method)}] ${updatedUrl} - Request throttled`);

						resolve(null);
					}

					return config;
				}),

			(res) => {
				this.log.info(`[${convertStringToUppercase(method)}] ${updatedUrl} - Response received`);

				return Promise.resolve(res);
			},
			(err) => {
				this.log.error(`[${convertStringToUppercase(method)}] ${updatedUrl} - Request failed with error: ${err.message}`);

				return Promise.reject(err);
			}
		);

		RequestAxiosInstance.interceptors.response.use(
			(res) => {
				// Send log message when endpoint request is successful
				this.log.info(`[${convertStringToUppercase(method)}] ${updatedUrl} (${res.status + " " + res.statusText})`);

				// Decrement pending requests
				this.pending_requests = Math.max(0, this.pending_requests - 1);

				return Promise.resolve(res);
			},
			async (err) => {
				if (err.response) {
					// Send log message when error response is received
					this.log.error(`[${convertStringToUppercase(method)}] ${updatedUrl} - Rejected with status code ${err.response.status}`, err.response.data);

					// Death by rate limit is self enforced
					await this.request(url, method, body, headers);
				} else if (err.request) {
					// Send log message when error request is received
					this.log.error(`[${convertStringToUppercase(method)}] ${updatedUrl} - The request was made but no response was received`, err.request);

					// Death by rate limit is self enforced
					await this.request(url, method, body, headers);
				} else {
					// Send log message when error is thrown
					this.log.error(`[${convertStringToUppercase(method)}] ${updatedUrl} - ${err.message}`);
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
					.then((res) => res)
					.catch((err) => err);

				return response;
			}
			case "post": {
				const response = await RequestAxiosInstance.post(url, body)
					.then((res) => res)
					.catch((err) => err);

				return response;
			}
			default:
				throw new Error(`The ${updatedMethod} method is currently not supported.`);
		}
	}

	async all(promises) {
		const tempData = [];

		promises.map(({ data }) => tempData.push(data));

		const response = await axios
			.all(tempData)
			.then(axios.spread((...responses) => responses && Array.isArray(responses) && responses.length > 0 && responses.map(({ data }) => data)))
			.then((res) => Promise.resolve(res))
			.catch((err) => Promise.reject(err));

		promises.map((res) => {
			res.data = response;

			return res;
		});

		return Promise.resolve(promises);
	}

	async expand(data) {
		const tempData = [];

		data.map((datum) => tempData.push(datum));

		const response = await axios
			.all(tempData)
			.then(axios.spread((...responses) => responses && Array.isArray(responses) && responses.length > 0 && responses.map((res) => res)))
			.then((res) => Promise.resolve(res))
			.catch((err) => Promise.reject(err));

		data.map((res) => {
			res.data = response;

			return res;
		});

		return Promise.resolve(data);
	}
}

export default Optimizely;
