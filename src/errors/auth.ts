import { AppError } from "./base";
import { ERROR_CODES } from "./codes";

export class EmailAlreadyExistsError extends AppError {
  constructor(email?: string) {
    const message = email
      ? `Електронна пошта ${email} вже використовується`
      : "Електронна пошта вже використовується";
    super(message, 409, ERROR_CODES.EMAIL_ALREADY_EXISTS);
  }
}

export class InvalidCredentialsError extends AppError {
  constructor() {
    super(
      "Неправильна електронна пошта або пароль",
      401,
      ERROR_CODES.INVALID_CREDENTIALS
    );
  }
}

export class TokenMissingError extends AppError {
  constructor() {
    super("Потрібен токен доступу", 401, ERROR_CODES.TOKEN_MISSING);
  }
}

export class TokenInvalidError extends AppError {
  constructor() {
    super("Недійсний або некоректний токен", 401, ERROR_CODES.TOKEN_INVALID);
  }
}

export class TokenExpiredError extends AppError {
  constructor() {
    super("Термін дії токена минув", 401, ERROR_CODES.TOKEN_EXPIRED);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Несанкціонований доступ") {
    super(message, 401, ERROR_CODES.UNAUTHORIZED);
  }
}

export class InsufficientPermissionsError extends AppError {
  constructor(required?: string[], current?: string) {
    let message = "Недостатньо дозволів";
    if (required && current) {
      message = `Недостатньо дозволів. Потрібно: ${required.join(
        ", "
      )}, Поточні: ${current}`;
    }
    super(message, 403, ERROR_CODES.INSUFFICIENT_PERMISSIONS);
  }
}

export class AccountLockedError extends AppError {
  constructor() {
    super("Обліковий запис заблоковано", 423, ERROR_CODES.ACCOUNT_LOCKED);
  }
}

export class AccountDisabledError extends AppError {
  constructor() {
    super("Обліковий запис вимкнено", 403, ERROR_CODES.ACCOUNT_DISABLED);
  }
}

export class SessionExpiredError extends AppError {
  constructor() {
    super("Сесія закінчилася", 401, ERROR_CODES.SESSION_EXPIRED);
  }
}
