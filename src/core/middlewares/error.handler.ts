import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { AppError } from "@/core/utils/app-error";
import { logger } from "@/core/utils/logger";
import { env } from "@/core/config/env.config";
import { Environments } from "@/core/types/index";

/**
 * Central error handler. Every failure ends here and is answered as JSON
 * (`{ status: "error", message }`), never as plain text or HTML.
 *
 * Handled cases, in order: Zod errors (400), malformed JSON body (400),
 * Prisma unique/not-found violations (409/404), `AppError` (its own status) and
 * any other error (500). Stack traces are only exposed in development.
 *
 * @param err Error thrown or passed to `next`.
 * @param req Request, only used for logging.
 * @param res Response used to send the JSON error.
 * @param _next Required so Express recognizes this as an error handler (4 arguments).
 */
export const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction) => {
  const isDevelopment = env.NODE_ENV === Environments.Development;

  if (err instanceof ZodError) {
    logger.warn({ issues: err.issues }, "Validation error");
    return res.status(400).json({
      status: "error",
      message: "Validation error",
      details: err.issues,
    });
  }

  if ((err as { type?: string }).type === "entity.parse.failed") {
    return res.status(400).json({ status: "error", message: "Malformed JSON body" });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      return res.status(409).json({ status: "error", message: "Resource already exists" });
    }
    if (err.code === "P2025") {
      return res.status(404).json({ status: "error", message: "Resource not found" });
    }
  }

  if (err instanceof AppError) {
    if (err.isOperational) {
      logger.warn({ err, path: req.path }, err.message);
    } else {
      logger.error({ err, path: req.path }, err.message);
    }

    return res.status(err.statusCode).json({
      status: "error",
      message: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
  }

  logger.error({ err, path: req.path }, "Unhandled error");

  return res.status(500).json({
    status: "error",
    message: isDevelopment ? err.message : "Internal server error",
    ...(isDevelopment ? { stack: err.stack } : {}),
  });
};
