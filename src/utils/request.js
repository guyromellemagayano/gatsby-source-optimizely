"use strict";

import axios from "axios";
import { REQUEST_ACCEPT_HEADER, REQUEST_URL_SLUG } from "../constants";
import { convertStringToUppercase } from "./convertValues";

export class Request {
	constructor(hostname, { headers, response_type, log, request_timeout } = {}) {
		this.hostname = hostname;
		this.headers = headers;
		this.response_type = response_type;
		this.log = log;
		this.request_timeout = request_timeout;
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
			(config) => {
				this.log.warn(`[${method.toUpperCase()}] ${this.hostname + REQUEST_URL_SLUG + path} - Request sent`);
				return config;
			},
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

				return Promise.resolve(res);
			},
			(err) => {
				if (err.response) {
					// Send log message when error response is received
					this.log.error(`[${convertStringToUppercase(method)}] ${this.hostname + REQUEST_URL_SLUG + path} - Restarting request...`);
				} else if (err.request) {
					// Send log message when error request is received
					this.log.error(`[${convertStringToUppercase(method)}] ${this.hostname + REQUEST_URL_SLUG + path} - Restarting request...`);
				} else {
					// Send log message when error is thrown
					this.log.error(`[${convertStringToUppercase(method)}] ${this.hostname + REQUEST_URL_SLUG + path} - ${err.message}`);
				}

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
