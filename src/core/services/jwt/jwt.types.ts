import { JwtPayload } from "jsonwebtoken";
import { UserRole } from "@prisma/client";

/** Kind of token: `access` for API calls, `refresh` to obtain a new pair. */
export type JwtTokenType = "access" | "refresh";

/** Claims stored inside every token, on top of the standard ones (`iat`, `exp`). */
export interface JwtUserPayload extends JwtPayload {
  /** Id of the user the token was issued to. */
  userId: number;
  /** Email of the user at the time of signing. */
  email: string;
  /** Role of the user at the time of signing; used for authorization checks. */
  role: UserRole;
  /** Token kind, prevents using a refresh token as an access token. */
  type: JwtTokenType;
}

/** Data required to sign a token (the `type` claim is added by the service). */
export type JwtSignPayload = Pick<JwtUserPayload, "userId" | "email" | "role">;
