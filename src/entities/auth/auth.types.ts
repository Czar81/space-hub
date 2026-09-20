import { UserRole } from "@prisma/client";

export interface AuthUser {
  userId: number;
  email: string;
  role: UserRole;
}