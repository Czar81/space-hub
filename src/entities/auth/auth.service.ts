import { User } from "@prisma/client";
import { jwtService } from "@/core/services/jwt/jwt.service";
import { AppError } from "@/core/utils/app-error";
import { usersService } from "@/entities/users/users.service";
import { LoginBody, RefreshBody, RegisterBody } from "@/entities/auth/auth.types";

/**
 * Builds the public user plus a fresh access/refresh token pair.
 *
 * @param user User row from the database.
 * @returns `{ user, token, refreshToken }`, the shape shared by register, login and refresh.
 */
const buildAuthResponse = (user: User) => {
  const payload = { userId: user.id, email: user.email, role: user.role };

  return {
    user: usersService.toPublic(user),
    token: jwtService.sign(payload),
    refreshToken: jwtService.signRefresh(payload),
  };
};

/** Registration, login and token refresh. Shared by REST and GraphQL. */
export const authService = {
  /**
   * Creates the account and logs the user in.
   *
   * @param data Validated registration body.
   * @returns The new user and a token pair.
   * @throws AppError 409 when the email is already registered.
   */
  async register(data: RegisterBody) {
    const user = await usersService.create(data);
    return buildAuthResponse(user);
  },

  /**
   * Checks the credentials. An unknown email and a wrong password share the same 401 message to avoid user enumeration.
   *
   * @param credentials Validated login body.
   * @returns The user and a token pair.
   * @throws AppError 401 when the credentials are wrong.
   */
  async login({ email, password }: LoginBody) {
    const user = await usersService.findByEmail(email);
    const isValid = user ? await usersService.verifyPassword(password, user.password) : false;

    if (!user || !isValid) {
      throw AppError.unauthorized("Invalid credentials");
    }

    return buildAuthResponse(user);
  },

  /**
   * Issues a new token pair from a valid refresh token.
   * The user is read again so the current role is used, and deleted users are rejected.
   *
   * @param body Validated body holding the refresh token.
   * @returns The user and a new token pair.
   * @throws AppError 401 when the token is invalid, expired, not a refresh token or its user no longer exists.
   */
  async refresh({ refreshToken }: RefreshBody) {
    const { userId } = jwtService.verify(refreshToken, "refresh");
    const user = await usersService.findById(userId);

    if (!user) {
      throw AppError.unauthorized("Invalid or expired token");
    }

    return buildAuthResponse(user);
  },
};
