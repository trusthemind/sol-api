import { createLogger, format, transports, Logger as WinstonLogger } from "winston";

class Logger {
  private logger: WinstonLogger;

  constructor(className: string) {
    this.logger = createLogger({
      level: "info",
      format: format.combine(
        format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        format.errors({ stack: true }),
        format.colorize(),
        format.printf(({ level, message, timestamp, stack }) => {
          return `${timestamp} [${level}] [${className}] : ${stack || message}`;
        })
      ),
      transports: [
        new transports.Console(),
        new transports.File({ filename: "logs/error.log", level: "error" }),
        new transports.File({ filename: "logs/combined.log" }),
      ],
    });
  }

  info(message: string) {
    this.logger.info(message);
  }

  warn(message: string) {
    this.logger.warn(message);
  }

  error(message: string | Error) {
    if (message instanceof Error) {
      this.logger.error(message.stack || message.message);
    } else {
      this.logger.error(message);
    }
  }

  debug(message: string) {
    this.logger.debug(message);
  }
}

export default Logger;
