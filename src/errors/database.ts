import { AppError } from "./base";
import { ERROR_CODES } from "./codes";

export class DatabaseConnectionError extends AppError {
  constructor(message?: string) {
    super(
      message || "Database connection failed",
      503,
      ERROR_CODES.DATABASE_CONNECTION_ERROR
    );
  }
}

export class DatabaseQueryError extends AppError {
  constructor(operation?: string, details?: string) {
    const message = operation
      ? `Database query failed during ${operation}${
          details ? `: ${details}` : ""
        }`
      : "Database query failed";
    super(message, 500, ERROR_CODES.DATABASE_QUERY_ERROR);
  }
}

export class DatabaseTransactionError extends AppError {
  constructor(message?: string) {
    super(
      message || "Database transaction failed",
      500,
      ERROR_CODES.DATABASE_TRANSACTION_ERROR
    );
  }
}

export class DuplicateKeyError extends AppError {
  constructor(field?: string) {
    const message = field
      ? `Duplicate key error: ${field} already exists`
      : "Duplicate key error";
    super(message, 409, ERROR_CODES.DUPLICATE_KEY_ERROR);
  }
}

export class ReferenceError extends AppError {
  constructor(message?: string) {
    super(
      message || "Database reference error",
      400,
      ERROR_CODES.REFERENCE_ERROR
    );
  }
}

export class DatabaseTimeoutError extends AppError {
  constructor() {
    super("Database operation timed out", 408, ERROR_CODES.DATABASE_TIMEOUT);
  }
}

export class DatabaseUnavailableError extends AppError {
  constructor() {
    super(
      "Database is currently unavailable",
      503,
      ERROR_CODES.DATABASE_UNAVAILABLE
    );
  }
}
