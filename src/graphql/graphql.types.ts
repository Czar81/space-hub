import { SpaceType } from "@prisma/client";
import { JwtUserPayload } from "@/core/services/jwt/jwt.types";
import { AppError } from "@/core/utils/app-error";

/**
 * Per-request context given to every resolver.
 * `authError` is set when a token was sent but is invalid; protected resolvers re-throw it.
 */
export interface GraphQLContext {
  /** Authenticated user, `null` for anonymous requests. */
  user: JwtUserPayload | null;
  /** Error found while reading the token, re-thrown by `requireUser`. */
  authError?: AppError;
}

/** Arguments of operations that receive a single id. */
export interface IdArgs {
  /** GraphQL `ID` (always a string, validated by `parseId`). */
  id: string;
}

/** Filters of the `spaces` query. */
export interface SpacesArgs {
  /** Return only spaces of this type. */
  type?: SpaceType;
  /** Return only spaces that fit at least this many people. */
  minCapacity?: number;
}

/** Arguments of the `updateMembership` mutation. */
export interface UpdateMembershipArgs {
  /** Id of the user whose membership changes. */
  userId: string;
  /** New plan, validated against `MembershipPlan`. */
  plan: string;
}
