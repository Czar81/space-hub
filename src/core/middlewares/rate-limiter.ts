import rateLimit from "express-rate-limit";
import { Request, Response, NextFunction } from "express";
import { AppError } from "@/core/utils/app-error";

const rateLimitHandler = (req: Request, res: Response, next: NextFunction) => {
  next(AppError.tooManyRequests());
};

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: rateLimitHandler,
});

export const graphqlLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});