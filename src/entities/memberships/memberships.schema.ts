import { z } from "zod";
import { MembershipPlan } from "@prisma/client";
import { MAX_DB_INT } from "@/core/schemas/id-param.schema";

/** Body of `PATCH /api/memberships/:userId`. */
export const updateMembershipSchema = z.object({
  plan: z.enum(MembershipPlan),
});

/** Validates the `:userId` route parameter. */
export const userIdParamSchema = z.object({
  userId: z.coerce.number().int().positive().max(MAX_DB_INT),
});
