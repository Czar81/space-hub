import { Request, Response, NextFunction } from "express";
import { UserRole } from "@prisma/client";
import { jwtService } from "@/core/services/jwt/jwt.service";
import { AppError } from "@/core/utils/app-error";

/**
 * Requires a valid access token in `Authorization: Bearer <token>` and stores its payload in `req.user`.
 * Forwards a 401 `AppError` when the token is missing, invalid, expired or is not an access token.
 *
 * @param req Request carrying the `Authorization` header.
 * @param _res Unused.
 * @param next Called with no arguments on success, with the error otherwise.
 */
export const authenticate = (req: Request, _res: Response, next: NextFunction) => {
  const token = jwtService.extractToken(req.headers.authorization);

  if (!token) {
    return next(AppError.unauthorized("Authentication token required"));
  }

  try {
    req.user = jwtService.verify(token);
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Restricts a route to the given roles. Must run after `authenticate`.
 * Forwards a 403 `AppError` when the role of the user is not allowed, even with a valid token.
 *
 * @param roles Roles allowed to reach the route.
 * @returns An Express middleware.
 *
 * @example
 * router.get("/reports", authenticate, authorize(UserRole.ADMIN), handler);
 */
export const authorize =
  (...roles: UserRole[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(AppError.unauthorized("Authentication token required"));
    }

    if (!roles.includes(req.user.role)) {
      return next(AppError.forbidden("You do not have permission to perform this action"));
    }

    next();
  };

/** Shortcut for `authorize(UserRole.ADMIN)`. */
export const requireAdmin = authorize(UserRole.ADMIN);
