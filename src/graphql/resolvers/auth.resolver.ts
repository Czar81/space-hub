import { authService } from "@/entities/auth/auth.service";
import { loginSchema, refreshSchema, registerSchema } from "@/entities/auth/auth.schema";
import { parseInput } from "@/graphql/guards";

/** Mutations `register`, `login` and `refreshToken` (public). Delegates to `authService`. */
export const authResolvers = {
  /** Mutation `register`: creates a MEMBER account and returns the user with a token pair. */
  register: (args: unknown) => authService.register(parseInput(registerSchema, args)),

  /** Mutation `login`: checks the credentials and returns the user with a token pair. */
  login: (args: unknown) => authService.login(parseInput(loginSchema, args)),

  /** Mutation `refreshToken`: exchanges a refresh token for a new token pair. */
  refreshToken: (args: unknown) => authService.refresh(parseInput(refreshSchema, args)),
};
