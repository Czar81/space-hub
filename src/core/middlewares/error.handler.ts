import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "@/core/utils/app-error";
import { logger } from "@/core/utils/logger";
import { env } from "@/core/config/env.config";
import { Environments } from "@/core/types/index";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const isDevelopment = env.NODE_ENV === Environments.Development;

  if (err instanceof ZodError) {
    logger.warn({ issues: err.issues }, "Validation error");
    return res.status(400).json({
      status: "error",
      message: "Validation error",
      details: err.issues,
    });
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