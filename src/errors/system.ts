import { AppError } from "./base";
import { ERROR_CODES } from "./codes";

export class InternalServerError extends AppError {
  constructor(message: string = "Internal server error occurred") {
    super(message, 500, ERROR_CODES.INTERNAL_SERVER_ERROR);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(service?: string) {
    const message = service 
      ? `${service} service is currently unavailable`
      : "Service temporarily unavailable";
    super(message, 503, ERROR_CODES.SERVICE_UNAVAILABLE);
  }
}

export class ConfigurationError extends AppError {
  constructor(setting?: string) {
    const message = setting 
      ? `Configuration error: ${setting} is not properly configured`
      : "System configuration error";
    super(message, 500, ERROR_CODES.CONFIGURATION_ERROR);
  }
}

export class MaintenanceModeError extends AppError {
  constructor() {
    super("System is currently under maintenance", 503, ERROR_CODES.MAINTENANCE_MODE);
  }
}

export class RegistrationError extends AppError {
  constructor(reason?: string) {
    const message = reason 
      ? `Registration failed: ${reason}`
      : "Registration process failed";
    super(message, 500, ERROR_CODES.REGISTRATION_ERROR);
  }
}

export class LoginError extends AppError {
  constructor(reason?: string) {
    const message = reason 
      ? `Login failed: ${reason}`
      : "Login process failed";
    super(message, 500, ERROR_CODES.LOGIN_ERROR);
  }
}

export class TokenRefreshError extends AppError {
  constructor(reason?: string) {
    const message = reason 
      ? `Token refresh failed: ${reason}`
      : "Failed to refresh token";
    super(message, 500, ERROR_CODES.TOKEN_REFRESH_ERROR);
  }
}

export class LogoutError extends AppError {
  constructor(reason?: string) {
    const message = reason 
      ? `Logout failed: ${reason}`
      : "Logout process failed";
    super(message, 500, ERROR_CODES.LOGOUT_ERROR);
  }
}