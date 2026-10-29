import { Request, Response, NextFunction } from "express";
import { AppError } from "@/core/utils/app-error";

/**
 * Catch-all for unknown routes. Forwards a 404 `AppError` so the answer is JSON.
 *
 * @param req Request that matched no route.
 * @param _res Unused.
 * @param next Receives the 404 error.
 */
export const notFoundHandler = (req: Request, _res: Response, next: NextFunction) => {
  next(AppError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
};
