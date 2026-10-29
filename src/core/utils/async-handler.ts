import { Request, Response, NextFunction, RequestHandler } from "express";

/**
 * Wraps an async route handler so a rejected promise reaches the error handler
 * (Express 4 does not forward them on its own).
 *
 * @param fn Async handler to wrap.
 * @returns A regular Express handler that forwards failures to `next`.
 *
 * @example
 * router.get("/", asyncHandler(async (req, res) => res.json(await service.list())));
 */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };
