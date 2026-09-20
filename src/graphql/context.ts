import jwt from "jsonwebtoken";
import { env } from "@/core/config/env.config";
import { IncomingHttpHeaders } from "http";

export interface GraphQLContext {
  user: string | jwt.JwtPayload | null;
}

export const createContext = (headers: IncomingHttpHeaders): GraphQLContext => {
  const token = (headers.authorization || "").replace("Bearer ", "");
  let user = null;

  if (token) {
    try {
      user = jwt.verify(token, env.JWT_SECRET);
    } catch {
      user = null;
    }
  }

  return { user };
};