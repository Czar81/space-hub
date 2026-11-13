/**
 * Application error carrying an HTTP status code.
 *
 * Throw it from services and middlewares (preferably through the static helpers);
 * the error handler turns it into a JSON response `{ status: "error", message, details? }`.
 *
 * @example
 * throw AppError.notFound("Space not found");
 * throw AppError.conflict("The space is not available at that time");
 */
export class AppError extends Error {
  /** HTTP status code sent to the client. */
  public readonly statusCode: number;
  /**
   * `true` for expected failures (bad input, not found), `false` for bugs; used to pick the log level.
   */
  public readonly isOperational: boolean;
  /** Optional extra data returned to the client, e.g. validation issues. */
  public readonly details?: unknown;

  /**
   * @param message Human readable message returned to the client.
   * @param statusCode HTTP status code of the response.
   * @param isOperational `true` for expected failures (bad input, not found), `false` for bugs.
   * @param details Extra data returned to the client, e.g. validation issues.
   */
  constructor(message: string, statusCode: number, isOperational = true, details?: unknown) {
    super(message);

    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;

    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  /** 400 - the request is malformed or fails validation. */
  static badRequest(message: string, details?: unknown) {
    return new AppError(message, 400, true, details);
  }

  /** 401 - missing, invalid or expired credentials. */
  static unauthorized(message = "Unauthorized") {
    return new AppError(message, 401, true);
  }

  /** 403 - authenticated but not allowed to perform the action. */
  static forbidden(message = "Forbidden") {
    return new AppError(message, 403, true);
  }

  /** 404 - the resource does not exist (or is hidden from the caller). */
  static notFound(message = "Resource not found") {
    return new AppError(message, 404, true);
  }

  /** 409 - the request conflicts with the current state, e.g. overlapping booking. */
  static conflict(message: string, details?: unknown) {
    return new AppError(message, 409, true, details);
  }

  /** 429 - rate limit exceeded. */
  static tooManyRequests(message = "Too many requests, please try again later") {
    return new AppError(message, 429, true);
  }

  /** 500 - unexpected failure, flagged as non operational. */
  static internal(message = "Internal server error") {
    return new AppError(message, 500, false);
  }
}
