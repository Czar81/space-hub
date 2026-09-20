import jwt, { SignOptions } from "jsonwebtoken";
import { env } from "@/core/config/env.config";
import { JwtUserPayload } from "./jwt.types";
import { AppError } from "@/core/utils/app-error";

const jwtSecret = env.JWT_SECRET;
const jwtExpiresIn = env.JWT_EXPIRES_IN;
const jwtRefreshExpiresIn = env.JWT_REFRESH_EXPIRES_IN;

export const jwtService = {
  sign(payload: { userId: number; email: string }): string {
    return jwt.sign(payload, jwtSecret, {
      expiresIn: jwtExpiresIn as SignOptions["expiresIn"],
    });
  },

  signRefresh(payload: { userId: number; email: string }): string {
    return jwt.sign(payload, jwtSecret, {
      expiresIn: jwtRefreshExpiresIn as SignOptions["expiresIn"],
    });
  },

  verify(token: string): JwtUserPayload {
    const decoded = jwt.verify(token, jwtSecret);

    if (typeof decoded === "string") {
      throw AppError.unauthorized("Invalid token payload");
    }

    return decoded as JwtUserPayload;
  },

  extractToken(authHeader?: string): string | null {
    if (!authHeader?.startsWith("Bearer ")) return null;
    return authHeader.slice(7);
  },
};