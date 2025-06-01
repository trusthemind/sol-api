export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: number;
  public readonly isOperational: boolean;
  public readonly timestamp: string;

  constructor(
    message: string,
    statusCode: number,
    errorCode: number,
    isOperational: boolean = true
  ) {
    super(message);

    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();

    Error.captureStackTrace(this, this.constructor);
  }

  public toJSON() {
    return {
      message: this.message,
      statusCode: this.statusCode,
      errorCode: this.errorCode,
      timestamp: this.timestamp,
      ...(process.env.NODE_ENV === "development" && { stack: this.stack }),
    };
  }
}

export interface ErrorResponse {
  message: string;
  statusCode: number;
  errorCode: number;
  timestamp: string;
  stack?: string;
}
