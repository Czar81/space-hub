import { JwtUserPayload } from "@/core/services/jwt/jwt.types";

/**
 * Adds the authenticated user to the Express request.
 * `req.user` is set by the `authenticate` middleware.
 */
declare global {
  namespace Express {
    interface Request {
      user?: JwtUserPayload;
    }
  }
}
