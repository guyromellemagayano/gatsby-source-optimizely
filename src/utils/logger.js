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
		verbose: 3,
		debug: 4,
		silly: 5
	},
	colors: {
		error: "bold red",
		warn: "bold yellow",
		info: "bold green",
		verbose: "bold blue",
		debug: "bold cyan",
		silly: "bold magenta"
	}
};

addColors(logLevels.colors);

const { combine, timestamp, colorize, simple } = format;

// Init `winston` logger
export const logger = (log_level) =>
	createLogger({
		level: log_level || "info",
		levels: logLevels.levels,
		format: combine(colorize(), simple(), timestamp()),
		transports: [new transports.Console()]
	});
