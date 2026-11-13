import { z } from "zod";
import { UserRole } from "@prisma/client";
import { registerSchema, loginSchema, refreshSchema } from "@/entities/auth/auth.schema";

/** Authenticated user as seen by services (taken from the access token). */
export interface AuthUser {
  /** Id of the user. */
  userId: number;
  /** Email of the user. */
  email: string;
  /** Role that decides what the user may do. */
  role: UserRole;
}

export type RegisterBody = z.infer<typeof registerSchema>;
export type LoginBody = z.infer<typeof loginSchema>;
export type RefreshBody = z.infer<typeof refreshSchema>;
