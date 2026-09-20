import { IncomingHttpHeaders } from "http";
import { JwtUserPayload } from "@/core/services/jwt/jwt.types";
import { jwtService } from "@/core/services/jwt/jwt.service";
import { AppError } from "@/core/utils/app-error";

export interface GraphQLContext {
  user: JwtUserPayload | null;
}

export const createContext = (headers: IncomingHttpHeaders): GraphQLContext => {
  const token = jwtService.extractToken(headers.authorization);

  if (!token) {
    return { user: null };
  }

  try {
    return { user: jwtService.verify(token) };
  } catch {
    throw AppError.unauthorized("Invalid or expired token");
  }
};