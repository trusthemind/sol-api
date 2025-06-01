export * from "./base";
export * from "./codes";
export * from "./auth";
export * from "./user";
export * from "./system";
export * from "./database";

import { Request, Response, NextFunction } from "express";
import { AppError } from "./base";

const ERROR_MAPPINGS = new Map([
  [
    "ValidationError",
    { message: "Validation failed", status: 400, code: 3001 },
  ],
  ["CastError", { message: "Invalid ID format", status: 400, code: 3002 }],
  ["JsonWebTokenError", { message: "Invalid token", status: 401, code: 1004 }],
  ["TokenExpiredError", { message: "Token expired", status: 401, code: 1005 }],
  [
    "MongoNetworkError",
    { message: "Database connection error", status: 503, code: 4001 },
  ],
]);

const SPECIAL_ERROR_HANDLERS = {
  handleDuplicateKeyError: (error: any): AppError => {
    const field = Object.keys(error.keyValue || {})[0];
    return new AppError(`Duplicate ${field || "key"} error`, 409, 4004);
  },

  handleGenericError: (error: Error): AppError => {
    return new AppError(
      error.message || "Something went wrong",
      500,
      9001,
      false
    );
  },
};

const convertToAppError = (error: Error | AppError): AppError => {
  if (error instanceof AppError) return error;

  if ((error as any).code === 11000)
    return SPECIAL_ERROR_HANDLERS.handleDuplicateKeyError(error);

  const mapping = ERROR_MAPPINGS.get(error.name);
  if (mapping)
    return new AppError(mapping.message, mapping.status, mapping.code);

  return SPECIAL_ERROR_HANDLERS.handleGenericError(error);
};

const createErrorResponse = (appError: AppError) => {
  const response: any = {
    code: appError.errorCode,
    message: appError.message,
  };

  if (process.env.NODE_ENV === "development") response.stack = appError.stack;

  return response;
};

export const errorHandler = (
  
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const appError = convertToAppError(error);

  if (res.headersSent) return next(error);

  res.setHeader("Content-Type", "application/json");
  res.status(appError.statusCode).json(createErrorResponse(appError));
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
