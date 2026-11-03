import { z } from "zod";
import { updateMembershipSchema } from "@/entities/memberships/memberships.schema";

export type UpdateMembershipBody = z.infer<typeof updateMembershipSchema>;
