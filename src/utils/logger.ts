import {
  createLogger,
  format,
  transports,
  Logger as WinstonLogger,
} from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import * as fs from "fs";
import * as path from "path";

const logDir = "logs";
const isProduction = process.env.NODE_ENV === "production";

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

class Logger {
  private logger: WinstonLogger;
  private context: Record<string, any> = {};

  constructor(private className: string = "App") {
    this.logger = createLogger({
      level: process.env.LOG_LEVEL || "info",
      format: this.createFormat(),
      transports: this.createTransports(),
      exitOnError: false,
      handleExceptions: true,
      handleRejections: true,
    });
  }

  private createFormat() {
    if (isProduction) {
      return format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        format((info) => {
          info.service = process.env.SERVICE_NAME || "app";
          info.className = this.className;
          if (Object.keys(this.context).length > 0) {
            info.context = this.context;
          }
          if (info.meta) {
            info.meta = this.sanitize(info.meta);
          }
          return info;
        })(),
        format.json()
      );
    }

    return format.combine(
      format.colorize(),
      format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
      format.errors({ stack: true }),
      format.printf(({ level, message, timestamp, stack, meta }) => {
        let output = `${timestamp} [${level}] [${this.className}]`;

        if (this.context.requestId) {
          output += ` [${this.context.requestId}]`;
        }

        output += `: ${stack || message}`;

        if (meta && Object.keys(meta).length > 0) {
          output += ` | ${JSON.stringify(this.sanitize(meta))}`;
        }

        return output;
      })
    );
  }

  private createTransports() {
    const transportsList: any[] = [new transports.Console()];

    if (isProduction) {
      transportsList.push(
        new DailyRotateFile({
          filename: path.join(logDir, "error-%DATE%.log"),
          datePattern: "YYYY-MM-DD",
          level: "error",
          maxFiles: "14d",
          maxSize: "20m",
        }),
        new DailyRotateFile({
          filename: path.join(logDir, "combined-%DATE%.log"),
          datePattern: "YYYY-MM-DD",
          maxFiles: "14d",
          maxSize: "20m",
        })
      );
    } else {
      transportsList.push(
        new transports.File({
          filename: path.join(logDir, "error.log"),
          level: "error",
        }),
        new transports.File({
          filename: path.join(logDir, "combined.log"),
        }),
        new transports.File({
          filename: path.join(logDir, "debug.log"),
          level: "debug",
        })
      );
    }

    return transportsList;
  }

  private sanitize(data: any): any {
    if (!data || typeof data !== "object") return data;

    const sensitiveFields = [
      "password",
      "token",
      "apikey",
      "secret",
      "authorization",
    ];
    const sanitized = Array.isArray(data) ? [] : {};

    for (const [key, value] of Object.entries(data)) {
      const isSensitive = sensitiveFields.some((field) =>
        key.toLowerCase().includes(field)
      );

      if (isSensitive) {
        (sanitized as any)[key] = "[REDACTED]";
      } else if (typeof value === "object" && value !== null) {
        (sanitized as any)[key] = this.sanitize(value);
      } else {
        (sanitized as any)[key] = value;
      }
    }

    return sanitized;
  }

  setContext(context: Record<string, any>) {
    this.context = { ...this.context, ...context };
  }

  clearContext() {
    this.context = {};
  }

  info(message: string, meta: object = {}) {
    this.logger.info(message, { meta, className: this.className });
  }

  warn(message: string, meta: object = {}) {
    this.logger.warn(message, { meta, className: this.className });
  }

  error(message: string, err?: Error | unknown, meta: object = {}) {
    let errorMessage = message;
    let errorMeta = { ...meta };

    if (err instanceof Error) {
      errorMessage = `${message}: ${err.message}`;
      errorMeta = {
        ...errorMeta,
        error: {
          name: err.name,
          message: err.message,
          stack: err.stack,
        },
      };
    } else if (err) {
      errorMeta = { ...errorMeta, error: err };
    }

    this.logger.error(errorMessage, {
      meta: errorMeta,
      className: this.className,
    });
  }

  debug(message: string, meta: object = {}) {
    this.logger.debug(message, { meta, className: this.className });
  }

  time(label: string) {
    const start = Date.now();
    return () => {
      const duration = Date.now() - start;
      this.debug(`Timer: ${label}`, { duration: `${duration}ms` });
      return duration;
    };
  }

  logRequest(
    method: string,
    url: string,
    statusCode: number,
    responseTime?: number,
    meta: object = {}
  ) {
    const level = statusCode >= 400 ? "warn" : "info";
    const message = `${method} ${url} ${statusCode}`;
    const requestMeta = {
      method,
      url,
      statusCode,
      responseTime: responseTime ? `${responseTime}ms` : undefined,
      ...meta,
    };

    if (level === "warn") {
      this.warn(message, requestMeta);
    } else {
      this.info(message, requestMeta);
    }
  }
}

class LoggerFactory {
  private static loggers = new Map<string, Logger>();

  static getLogger(className: string = "App"): Logger {
    if (!this.loggers.has(className)) {
      this.loggers.set(className, new Logger(className));
    }
    return this.loggers.get(className)!;
  }
}

export { Logger, LoggerFactory };
export default Logger;
