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

/** Filters of the `spaces` query, validated with `listSpacesQuerySchema`. */
export interface SpacesArgs {
  /** Return only spaces of this type. */
  type?: SpaceType | null;
  /** Return only spaces that fit at least this many people. */
  minCapacity?: number | null;
  /** YYYY-MM-DD: return only spaces free during the whole UTC day. */
  date?: string | null;
  /** ISO date-time, sent with `endTime`: return only spaces free during the range. */
  startTime?: string | null;
  /** ISO date-time, sent with `startTime`. */
  endTime?: string | null;
}

/** Arguments of the `spaceAvailabilityChanged` subscription. */
export interface SpaceAvailabilityArgs {
  /** Only receive events of this space; every space when omitted. */
  spaceId?: string | null;
}

/** Arguments of the `updateMembership` mutation. */
export interface UpdateMembershipArgs {
  /** Id of the user whose membership changes. */
  userId: string;
  /** New plan, validated against `MembershipPlan`. */
  plan: string;
}
