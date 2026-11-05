import { IncomingHttpHeaders } from "http";
import { GraphQLContext } from "@/graphql/graphql.types";
import { jwtService } from "@/core/services/jwt/jwt.service";
import { AppError } from "@/core/utils/app-error";

/**
 * Builds the GraphQL context from the request headers.
 * No token gives an anonymous context. An invalid token is stored as `authError`
 * instead of throwing, so public queries keep working and protected ones fail with a proper error.
 *
 * @param headers Incoming HTTP headers.
 * @returns The context shared by every resolver of the request.
 */
export const createContext = (headers: IncomingHttpHeaders): GraphQLContext => {
  const token = jwtService.extractToken(headers.authorization);

  if (!token) {
    return { user: null };
  }

  try {
    return { user: jwtService.verify(token) };
  } catch (error) {
    // Public queries still work; protected resolvers re-throw this error through requireUser
    return {
      user: null,
      authError:
        error instanceof AppError ? error : AppError.unauthorized("Invalid or expired token"),
    };
  }
};
