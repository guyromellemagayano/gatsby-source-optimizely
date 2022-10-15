import { addColors, createLogger, format, transports } from "winston";

/**
 * ============================================================================
 * Logger settings
 * ============================================================================
 */
const logLevels = {
	levels: {
		error: 0,
		warn: 1,
		info: 2,
		http: 3,
		verbose: 4,
		debug: 5,
		silly: 6
	},
	colors: {
		error: "bold red",
		warn: "bold yellow",
		info: "bold green",
		http: "bold magenta",
		verbose: "bold cyan",
		debug: "bold blue",
		silly: "bold white"
	}
};

addColors(logLevels.colors);

const { combine, timestamp, colorize, simple } = format;

// Init `winston` logger
export const logger = (log_level) =>
	createLogger({
		level: log_level || "debug",
		levels: logLevels.levels,
		format: combine(colorize(), simple(), timestamp()),
		transports: [new transports.Console()]
	});
