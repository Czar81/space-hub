export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(message: string, statusCode: number, isOperational = true, details?: unknown) {
    super(message);

    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;

    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, details?: unknown) {
    return new AppError(message, 400, true, details);
  }

  static unauthorized(message = "Unauthorized") {
    return new AppError(message, 401, true);
  }

  static forbidden(message = "Forbidden") {
    return new AppError(message, 403, true);
  }

  static notFound(message = "Resource not found") {
    return new AppError(message, 404, true);
  }

  static conflict(message: string, details?: unknown) {
    return new AppError(message, 409, true, details);
  }

  static tooManyRequests(message = "Too many requests, please try again later") {
    return new AppError(message, 429, true);
  }

  static internal(message = "Internal server error") {
    return new AppError(message, 500, false);
  }
}