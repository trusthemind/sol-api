import { AppError } from "./base";
import { ERROR_CODES } from "./codes";

export class UserNotFoundError extends AppError {
  constructor(identifier?: string) {
    const message = identifier
      ? `Користувача з ${identifier} не знайдено`
      : "Користувача не знайдено";
    super(message, 404, ERROR_CODES.USER_NOT_FOUND);
  }
}

export class UserAlreadyExistsError extends AppError {
  constructor(identifier?: string) {
    const message = identifier
      ? `Користувач з ${identifier} вже існує`
      : "Користувач вже існує";
    super(message, 409, ERROR_CODES.USER_ALREADY_EXISTS);
  }
}

export class InvalidUserIdError extends AppError {
  constructor(id?: string) {
    const message = id
      ? `Недійсний ID користувача: ${id}`
      : "Недійсний формат ID користувача";
    super(message, 400, ERROR_CODES.INVALID_USER_ID);
  }
}

export class UserCreationFailedError extends AppError {
  constructor(reason?: string) {
    const message = reason
      ? `Не вдалося створити користувача: ${reason}`
      : "Не вдалося створити користувача";
    super(message, 500, ERROR_CODES.USER_CREATION_FAILED);
  }
}

export class UserUpdateFailedError extends AppError {
  constructor(reason?: string) {
    const message = reason
      ? `Не вдалося оновити користувача: ${reason}`
      : "Не вдалося оновити користувача";
    super(message, 500, ERROR_CODES.USER_UPDATE_FAILED);
  }
}

export class UserDeletionFailedError extends AppError {
  constructor(reason?: string) {
    const message = reason
      ? `Не вдалося видалити користувача: ${reason}`
      : "Не вдалося видалити користувача";
    super(message, 500, ERROR_CODES.USER_DELETION_FAILED);
  }
}

export class InvalidCurrentPasswordError extends AppError {
  constructor() {
    super(
      "Поточний пароль неправильний",
      400,
      ERROR_CODES.INVALID_CURRENT_PASSWORD
    );
  }
}

export class PasswordUpdateFailedError extends AppError {
  constructor(reason?: string) {
    const message = reason
      ? `Не вдалося оновити пароль: ${reason}`
      : "Не вдалося оновити пароль";
    super(message, 500, ERROR_CODES.PASSWORD_UPDATE_FAILED);
  }
}

export class ProfileUpdateFailedError extends AppError {
  constructor(reason?: string) {
    const message = reason
      ? `Не вдалося оновити профіль: ${reason}`
      : "Не вдалося оновити профіль";
    super(message, 500, ERROR_CODES.PROFILE_UPDATE_FAILED);
  }
}

export class CannotDeleteSelfError extends AppError {
  constructor() {
    super(
      "Неможливо видалити власний обліковий запис через цю точку доступу",
      400,
      ERROR_CODES.CANNOT_DELETE_SELF
    );
  }
}
