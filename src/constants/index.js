// Environment
export const IS_DEV = process.env.NODE_ENV === "development";
export const IS_PROD = process.env.NODE_ENV === "production";

// Console colors
export const FG_BLACK = "\x1b[30m%s\x1b[0m";
export const FG_RED = "\x1b[31m%s\x1b[0m";
export const FG_GREEN = "\x1b[32m%s\x1b[0m";
export const FG_YELLOW = "\x1b[33m%s\x1b[0m";
export const FG_BLUE = "\x1b[34m%s\x1b[0m";
export const FG_MAGENTA = "\x1b[35m%s\x1b[0m";
export const FG_CYAN = "\x1b[36m%s\x1b[0m";
export const FG_WHITE = "\x1b[37m%s\x1b[0m";

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
