import { formatDates } from "@/core/utils/format-dates";
import { membershipsService } from "@/entities/memberships/memberships.service";
import { updateMembershipSchema } from "@/entities/memberships/memberships.schema";
import { GraphQLContext, UpdateMembershipArgs } from "@/graphql/graphql.types";
import { parseId, parseInput, requireAdminUser } from "@/graphql/guards";

/** Query `memberships` and mutation `updateMembership`. Admin only. Delegates to `membershipsService`. */
export const membershipsResolvers = {
  /** Query `memberships`: active memberships with their owner. Admin only. */
  memberships: async (_args: unknown, context: GraphQLContext) => {
    requireAdminUser(context);
    return formatDates(await membershipsService.listActive());
  },

  /** Mutation `updateMembership`: changes the plan of a user. Admin only. */
  updateMembership: async ({ userId, plan }: UpdateMembershipArgs, context: GraphQLContext) => {
    requireAdminUser(context);
    const body = parseInput(updateMembershipSchema, { plan });
    return formatDates(await membershipsService.updatePlan(parseId(userId, "userId"), body));
  },
};
