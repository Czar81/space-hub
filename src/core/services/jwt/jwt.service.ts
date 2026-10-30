import jwt, { SignOptions } from "jsonwebtoken";
import { env } from "@/core/config/env.config";
import { JwtSignPayload, JwtTokenType, JwtUserPayload } from "./jwt.types";
import { AppError } from "@/core/utils/app-error";

const jwtSecret = env.JWT_SECRET;
const jwtExpiresIn = env.JWT_EXPIRES_IN;
const jwtRefreshExpiresIn = env.JWT_REFRESH_EXPIRES_IN;

/**
 * Algorithm is pinned on sign and verify so tokens signed with another one (e.g. `none`) are rejected.
 */
const JWT_ALGORITHM = "HS256";

/** Single place that creates and checks JWTs, shared by REST and GraphQL. */
export const jwtService = {
  /**
   * Creates a short lived access token (`JWT_EXPIRES_IN`).
   *
   * @param payload User id, email and role to embed in the token.
   * @returns The signed JWT.
   */
  sign(payload: JwtSignPayload): string {
    return jwt.sign({ ...payload, type: "access" }, jwtSecret, {
      algorithm: JWT_ALGORITHM,
      expiresIn: jwtExpiresIn as SignOptions["expiresIn"],
    });
  },

  /**
   * Creates a long lived refresh token (`JWT_REFRESH_EXPIRES_IN`).
   * It is only accepted by `/api/auth/refresh`, never as an access token.
   *
   * @param payload User id, email and role to embed in the token.
   * @returns The signed JWT.
   */
  signRefresh(payload: JwtSignPayload): string {
    return jwt.sign({ ...payload, type: "refresh" }, jwtSecret, {
      algorithm: JWT_ALGORITHM,
      expiresIn: jwtRefreshExpiresIn as SignOptions["expiresIn"],
    });
  },

  /**
   * Verifies signature, expiration and token type.
   *
   * @param token Raw JWT, without the `Bearer ` prefix.
   * @param type Expected kind of token, so a refresh token cannot be used as an access token.
   * @returns The decoded claims.
   * @throws AppError 401 when the token is invalid, expired or of another type.
   */
  verify(token: string, type: JwtTokenType = "access"): JwtUserPayload {
    let decoded: string | jwt.JwtPayload;

    try {
      decoded = jwt.verify(token, jwtSecret, { algorithms: [JWT_ALGORITHM] });
    } catch {
      throw AppError.unauthorized("Invalid or expired token");
    }

    if (typeof decoded === "string" || decoded.type !== type) {
      throw AppError.unauthorized("Invalid token payload");
    }

    return decoded as JwtUserPayload;
  },

  /**
   * Reads the token from an `Authorization: Bearer <token>` header.
   *
   * @param authHeader Raw value of the `Authorization` header.
   * @returns The token, or `null` when the header is absent or malformed.
   */
  extractToken(authHeader?: string): string | null {
    if (!authHeader?.startsWith("Bearer ")) return null;
    return authHeader.slice(7) || null;
  },
};
