import axios from "axios";
import qs from "qs";
import { AUTH_ENDPOINT, AUTH_REQUEST_CONTENT_TYPE_HEADER, REQUEST_ACCEPT_HEADER, REQUEST_URL_SLUG } from "../constants";

class Auth {
	constructor(config) {
		if (!config) {
			throw new Error("Optimizely/Episerver API auth config required. It is required to make any call to the API");
		}

		this.site_url = config.site_url;
		this.username = config.username;
		this.password = config.password;
		this.grant_type = config.grant_type;
		this.client_id = config.client_id;
		this.response_type = config.response_type;
		this.request_timeout = config.request_timeout;
	}

	async post() {
		let config = {
			method: "post",
			url: this.site_url + REQUEST_URL_SLUG + AUTH_ENDPOINT,
			headers: {
				"Accept": REQUEST_ACCEPT_HEADER,
				"Content-Type": AUTH_REQUEST_CONTENT_TYPE_HEADER
			},
			data: qs.stringify(
				{
					password: this.password,
					username: this.username,
					grant_type: this.grant_type,
					client_id: this.client_id
				},
				{ encode: false }
			)
		};

		const { data } = await axios(config)
			.then((res) => {
				// Send log message when endpoint request is successful
				this.log.info(`[${config.method.toUpperCase()}] ${config.url} (${res.status + " " + res.statusText})`);

				return Promise.resolve(res);
			})
			.catch((err) => {
				this.log.error(`[${config.method.toUpperCase()}] ${config.url} (${err.status + " " + err.statusText})`);

				return Promise.reject(err);
			});

		return data;
	}
}

export default Auth;
