import { AppError } from "./base";
import { ERROR_CODES } from "./codes";

export class EmailAlreadyExistsError extends AppError {
  constructor(email?: string) {
    const message = email
      ? `Email ${email} is already in use`
      : "Email already in use";
    super(message, 409, ERROR_CODES.EMAIL_ALREADY_EXISTS);
  }
}

export class InvalidCredentialsError extends AppError {
  constructor() {
    super("Invalid email or password", 401, ERROR_CODES.INVALID_CREDENTIALS);
  }
}

export class TokenMissingError extends AppError {
  constructor() {
    super("Access token is required", 401, ERROR_CODES.TOKEN_MISSING);
  }
}

export class TokenInvalidError extends AppError {
  constructor() {
    super("Invalid or malformed token", 401, ERROR_CODES.TOKEN_INVALID);
  }
}

export class TokenExpiredError extends AppError {
  constructor() {
    super("Token has expired", 401, ERROR_CODES.TOKEN_EXPIRED);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized access") {
    super(message, 401, ERROR_CODES.UNAUTHORIZED);
  }
}

export class InsufficientPermissionsError extends AppError {
  constructor(required?: string[], current?: string) {
    let message = "Insufficient permissions";
    if (required && current) {
      message = `Insufficient permissions. Required: ${required.join(
        ", "
      )}, Current: ${current}`;
    }
    super(message, 403, ERROR_CODES.INSUFFICIENT_PERMISSIONS);
  }
}

export class AccountLockedError extends AppError {
  constructor() {
    super("Account has been locked", 423, ERROR_CODES.ACCOUNT_LOCKED);
  }
}

export class AccountDisabledError extends AppError {
  constructor() {
    super("Account has been disabled", 403, ERROR_CODES.ACCOUNT_DISABLED);
  }
}

export class SessionExpiredError extends AppError {
  constructor() {
    super("Session has expired", 401, ERROR_CODES.SESSION_EXPIRED);
  }
}
