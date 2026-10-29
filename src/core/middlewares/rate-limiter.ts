import rateLimit from "express-rate-limit";
import { Request, Response, NextFunction } from "express";
import { AppError } from "@/core/utils/app-error";
import { env } from "@/core/config/env.config";
import { Environments } from "@/core/types/index";

/** Rate limiting is disabled in the Test environment so the Bruno suite is not throttled. */
const skip = () => env.NODE_ENV === Environments.Test;

/** Forwards rate limit hits to the error handler so they are answered as JSON. */
const rateLimitHandler = (req: Request, res: Response, next: NextFunction) => {
  next(AppError.tooManyRequests());
};

/** 100 requests per 15 minutes per IP for the whole API. */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skip,
});

/** 5 failed attempts per 15 minutes per IP on the auth routes (successful requests are not counted). */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: rateLimitHandler,
  skip,
});

/** 30 requests per minute per IP on the GraphQL endpoint. */
export const graphqlLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skip,
});
