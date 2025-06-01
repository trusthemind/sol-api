import { AppError } from "./base";
import { ERROR_CODES } from "./codes";

export class UserNotFoundError extends AppError {
  constructor(identifier?: string) {
    const message = identifier
      ? `User with ${identifier} not found`
      : "User not found";
    super(message, 404, ERROR_CODES.USER_NOT_FOUND);
  }
}

export class UserAlreadyExistsError extends AppError {
  constructor(identifier?: string) {
    const message = identifier
      ? `User with ${identifier} already exists`
      : "User already exists";
    super(message, 409, ERROR_CODES.USER_ALREADY_EXISTS);
  }
}

export class InvalidUserIdError extends AppError {
  constructor(id?: string) {
    const message = id ? `Invalid user ID: ${id}` : "Invalid user ID format";
    super(message, 400, ERROR_CODES.INVALID_USER_ID);
  }
}

export class UserCreationFailedError extends AppError {
  constructor(reason?: string) {
    const message = reason
      ? `Failed to create user: ${reason}`
      : "Failed to create user";
    super(message, 500, ERROR_CODES.USER_CREATION_FAILED);
  }
}

export class UserUpdateFailedError extends AppError {
  constructor(reason?: string) {
    const message = reason
      ? `Failed to update user: ${reason}`
      : "Failed to update user";
    super(message, 500, ERROR_CODES.USER_UPDATE_FAILED);
  }
}

export class UserDeletionFailedError extends AppError {
  constructor(reason?: string) {
    const message = reason
      ? `Failed to delete user: ${reason}`
      : "Failed to delete user";
    super(message, 500, ERROR_CODES.USER_DELETION_FAILED);
  }
}

export class InvalidCurrentPasswordError extends AppError {
  constructor() {
    super(
      "Current password is incorrect",
      400,
      ERROR_CODES.INVALID_CURRENT_PASSWORD
    );
  }
}

export class PasswordUpdateFailedError extends AppError {
  constructor(reason?: string) {
    const message = reason
      ? `Failed to update password: ${reason}`
      : "Failed to update password";
    super(message, 500, ERROR_CODES.PASSWORD_UPDATE_FAILED);
  }
}

export class ProfileUpdateFailedError extends AppError {
  constructor(reason?: string) {
    const message = reason
      ? `Failed to update profile: ${reason}`
      : "Failed to update profile";
    super(message, 500, ERROR_CODES.PROFILE_UPDATE_FAILED);
  }
}

export class CannotDeleteSelfError extends AppError {
  constructor() {
    super(
      "Cannot delete your own account through this endpoint",
      400,
      ERROR_CODES.CANNOT_DELETE_SELF
    );
  }
}
