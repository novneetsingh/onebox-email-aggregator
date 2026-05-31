import winston from "winston";

/**
 * Beautiful Console Logger
 * Focused purely on stunning, detailed console output for development.
 * Supports multiple arguments just like console.log.
 */

// Define colors for each level
const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "cyan",
  verbose: "blue",
  silly: "gray",
};

winston.addColors(colors);

// Custom format for beautiful display
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.printf(({ timestamp, level, message, ...metadata }) => {
    const colorizer = winston.format.colorize();

    // Uppercase the level
    const levelTag = `[${level.toUpperCase()}]`;

    // Format timestamp in white (ANSI code 37m)
    const whiteTimestamp = `\x1b[37m[${timestamp}]\x1b[39m`;

    // Colorize only the level and message
    const coloredLevelAndMessage = colorizer.colorize(
      level,
      `${levelTag}: ${message}`,
    );

    let msg = `${whiteTimestamp} ${coloredLevelAndMessage}`;

    // If there's extra metadata (objects passed to log), print them nicely
    if (Object.keys(metadata).length > 0) {
      const cleanMeta = { ...metadata };
      delete cleanMeta[Symbol.for("level")];
      delete cleanMeta[Symbol.for("message")];
      delete cleanMeta[Symbol.for("splat")];

      if (Object.keys(cleanMeta).length > 0) {
        msg += ` \n${JSON.stringify(cleanMeta, null, 2)}`;
      }
    }

    return msg;
  }),
);

// Create the logger
const baseLogger = winston.createLogger({
  level: "silly",
  transports: [
    new winston.transports.Console({
      format: consoleFormat,
    }),
  ],
});

/**
 * Wrapper to support standard console.log behavior with multiple arguments.
 * Join all arguments into a single string for display.
 */
const wrapLogger = (loggerInstance: any) => {
  const levels = ["error", "warn", "info", "http", "debug", "verbose", "silly"];

  levels.forEach((level: string) => {
    const original = loggerInstance[level].bind(loggerInstance);

    loggerInstance[level] = (...args: any[]) => {
      if (args.length === 0) return;

      // Join items like console.log does
      const formattedMessage = args
        .map((arg: any) => {
          if (arg instanceof Error) return arg.stack || arg.message;
          if (typeof arg === "object") {
            try {
              return JSON.stringify(arg, null, 2);
            } catch (e) {
              return "[Circular Object]";
            }
          }
          return arg;
        })
        .join(" ");

      return original(formattedMessage);
    };
  });

  return loggerInstance;
};

const logger = wrapLogger(baseLogger);

// Morgan integration
logger.stream = {
  write: (message: string) => logger.info(message.trim()),
};

export default logger;
