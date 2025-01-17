// Environment
export const IS_DEV = process.env.NODE_ENV === "development";
export const IS_PROD = process.env.NODE_ENV === "production";

// App
export const APP_NAME = "gatsby-source-optimizely";

// Cache
export const CACHE_KEY = null;

// Request
export const REQUEST_URL_SLUG = "/api/episerver";
export const REQUEST_ACCEPT_HEADER = "application/json";
export const REQUEST_TIMEOUT = 0;
export const REQUEST_THROTTLE_INTERVAL = 0;
export const REQUEST_DEBOUNCE_INTERVAL = 0;
export const REQUEST_CONCURRENCY = 10000;
export const REQUEST_PENDING_COUNT = 0;
export const REQUEST_RESPONSE_TYPE = "json";

// Headers
export const ACCESS_CONTROL_ALLOW_HEADERS = "Content-Type,Accept";
export const ACCESS_CONTROL_ALLOW_CREDENTIALS = true;
export const CORS_ORIGIN = "*";

// Endpoints
export const CONTENT_ENDPOINT = REQUEST_URL_SLUG + "/v2.0/content/";

// Auth
export const AUTH_REQUEST_CONTENT_TYPE_HEADER = "application/x-www-form-urlencoded";
export const AUTH_ENDPOINT = "/auth/token";
export const AUTH_GRANT_TYPE = "password";
export const AUTH_CLIENT_ID = "Default";
export const AUTH_HEADERS = {};
