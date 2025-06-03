import { AppError } from "./base";
import { ERROR_CODES } from "./codes";

export class DatabaseConnectionError extends AppError {
  constructor(message?: string) {
    super(
      message || "Не вдалося підключитися до бази даних",
      503,
      ERROR_CODES.DATABASE_CONNECTION_ERROR
    );
  }
}

export class DatabaseQueryError extends AppError {
  constructor(operation?: string, details?: string) {
    const message = operation
      ? `Запит до бази даних не виконано під час ${operation}${
          details ? `: ${details}` : ""
        }`
      : "Запит до бази даних не виконано";
    super(message, 500, ERROR_CODES.DATABASE_QUERY_ERROR);
  }
}

export class DatabaseTransactionError extends AppError {
  constructor(message?: string) {
    super(
      message || "Транзакція бази даних не виконана",
      500,
      ERROR_CODES.DATABASE_TRANSACTION_ERROR
    );
  }
}

export class DuplicateKeyError extends AppError {
  constructor(field?: string) {
    const message = field
      ? `Помилка дубльованого ключа: ${field} вже існує`
      : "Помилка дубльованого ключа";
    super(message, 409, ERROR_CODES.DUPLICATE_KEY_ERROR);
  }
}

export class ReferenceError extends AppError {
  constructor(message?: string) {
    super(
      message || "Помилка посилання бази даних",
      400,
      ERROR_CODES.REFERENCE_ERROR
    );
  }
}

export class DatabaseTimeoutError extends AppError {
  constructor() {
    super("Час очікування операції бази даних минув", 408, ERROR_CODES.DATABASE_TIMEOUT);
  }
}

export class DatabaseUnavailableError extends AppError {
  constructor() {
    super(
      "База даних наразі недоступна",
      503,
      ERROR_CODES.DATABASE_UNAVAILABLE
    );
  }
}