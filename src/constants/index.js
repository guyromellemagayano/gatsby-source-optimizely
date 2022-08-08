// Environment
export const IS_DEV = process.env.NODE_ENV === "development";
export const IS_PROD = process.env.NODE_ENV === "production";

// Request
export const REQUEST_URL_SLUG = "/api/episerver";
export const REQUEST_ACCEPT_HEADER = "application/json";
export const REQUEST_TIMEOUT = 0;

// Auth
export const AUTH_REQUEST_CONTENT_TYPE_HEADER = "application/x-www-form-urlencoded";

// Optimizely
export const OPTIMIZELY_AUTH_ENDPOINT = "/auth/token";

export const ACCESS_CONTROL_ALLOW_HEADERS = "Content-Type,Accept";
export const ACCESS_CONTROL_ALLOW_CREDENTIALS = true;
export const CORS_ORIGIN = "*";
