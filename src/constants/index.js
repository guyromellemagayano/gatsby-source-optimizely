// Environment
export const IS_DEV = process.env.NODE_ENV === "development";
export const IS_PROD = process.env.NODE_ENV === "production";

// Request
export const REQUEST_URL_SLUG = "/api/episerver";
export const REQUEST_ACCEPT_HEADER = "application/json";
export const REQUEST_CONTENT_TYPE_HEADER = "application/json";
export const REQUEST_HEADERS = {
	"Accept": REQUEST_ACCEPT_HEADER,
	"Content-Type": REQUEST_CONTENT_TYPE_HEADER
};
export const REQUEST_TIMEOUT = 0;

// Optimizely
export const OPTIMIZELY_AUTH_ENDPOINT = "/auth/token";
