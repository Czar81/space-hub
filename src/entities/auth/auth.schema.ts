import { z } from "zod";

/**
 * Body of `POST /api/auth/register`. The email is trimmed and lower-cased; a `role` sent by the client is ignored.
 */
export const registerSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.email().trim().toLowerCase(),
  password: z.string().min(8).max(72),
});

/** Body of `POST /api/auth/refresh`. */
export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

/** Body of `POST /api/auth/login`. */
export const loginSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(1).max(72),
});
