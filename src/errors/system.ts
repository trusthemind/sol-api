import { AppError } from "./base";
import { ERROR_CODES } from "./codes";

export class InternalServerError extends AppError {
  constructor(message: string = "Сталася внутрішня помилка сервера") {
    super(message, 500, ERROR_CODES.INTERNAL_SERVER_ERROR);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(service?: string) {
    const message = service 
      ? `Сервіс ${service} наразі недоступний`
      : "Сервіс тимчасово недоступний";
    super(message, 503, ERROR_CODES.SERVICE_UNAVAILABLE);
  }
}

export class ConfigurationError extends AppError {
  constructor(setting?: string) {
    const message = setting 
      ? `Помилка конфігурації: ${setting} налаштовано неправильно`
      : "Помилка конфігурації системи";
    super(message, 500, ERROR_CODES.CONFIGURATION_ERROR);
  }
}

export class MaintenanceModeError extends AppError {
  constructor() {
    super("Система наразі на технічному обслуговуванні", 503, ERROR_CODES.MAINTENANCE_MODE);
  }
}

export class RegistrationError extends AppError {
  constructor(reason?: string) {
    const message = reason 
      ? `Реєстрація не вдалася: ${reason}`
      : "Процес реєстрації не вдався";
    super(message, 500, ERROR_CODES.REGISTRATION_ERROR);
  }
}

export class LoginError extends AppError {
  constructor(reason?: string) {
    const message = reason 
      ? `Вхід не вдався: ${reason}`
      : "Процес входу не вдався";
    super(message, 500, ERROR_CODES.LOGIN_ERROR);
  }
}

export class TokenRefreshError extends AppError {
  constructor(reason?: string) {
    const message = reason 
      ? `Оновлення токена не вдалося: ${reason}`
      : "Не вдалося оновити токен";
    super(message, 500, ERROR_CODES.TOKEN_REFRESH_ERROR);
  }
}

export class LogoutError extends AppError {
  constructor(reason?: string) {
    const message = reason 
      ? `Вихід не вдався: ${reason}`
      : "Процес виходу не вдався";
    super(message, 500, ERROR_CODES.LOGOUT_ERROR);
  }
}