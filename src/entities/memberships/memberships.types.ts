import { MembershipPlan } from "@prisma/client";

export interface UpdateMembershipBody {
  plan: MembershipPlan;
}