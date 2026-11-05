import { ZodError, ZodType } from "zod";
import { UserRole } from "@prisma/client";
import { MAX_DB_INT } from "@/core/schemas/id-param.schema";
import { AppError } from "@/core/utils/app-error";
import { AuthUser } from "@/entities/auth/auth.types";
import { GraphQLContext } from "@/graphql/graphql.types";

/**
 * Returns the authenticated user or throws.
 *
 * @param context GraphQL context of the request.
 * @returns The user taken from the access token.
 * @throws AppError 401 when there is no token or it is invalid.
 */
export const requireUser = (context: GraphQLContext): AuthUser => {
  if (context.authError) throw context.authError;
  if (!context.user) throw AppError.unauthorized("Authentication token required");
  return context.user;
};

/**
 * Returns the authenticated user, making sure it is an admin.
 *
 * @param context GraphQL context of the request.
 * @returns The admin user.
 * @throws AppError 401 when there is no valid token.
 * @throws AppError 403 when the user is not an admin.
 */
export const requireAdminUser = (context: GraphQLContext): AuthUser => {
  const user = requireUser(context);
  if (user.role !== UserRole.ADMIN) throw AppError.forbidden("Admin access required");
  return user;
};

/**
 * Validates resolver arguments with the same Zod schemas the REST routes use.
 *
 * @param schema Zod schema to validate against.
 * @param data Raw arguments received by the resolver.
 * @returns The parsed and typed data.
 * @throws AppError 400 with the Zod issues in `details`.
 */
export const parseInput = <T>(schema: ZodType<T>, data: unknown): T => {
  const result = schema.safeParse(data);

  if (!result.success) {
    throw AppError.badRequest("Validation error", (result.error as ZodError).issues);
  }

  return result.data;
};

/**
 * Converts a GraphQL `ID` (a string) into a valid database id.
 *
 * @param id Raw id received by the resolver.
 * @param label Name used in the error message, `id` by default.
 * @returns A positive integer that fits a PostgreSQL `INTEGER`.
 * @throws AppError 400 when the value is not a valid id.
 */
export const parseId = (id: string, label = "id"): number => {
  const value = Number(id);

  if (!Number.isInteger(value) || value <= 0 || value > MAX_DB_INT) {
    throw AppError.badRequest(`Invalid ${label}`);
  }

  return value;
};
