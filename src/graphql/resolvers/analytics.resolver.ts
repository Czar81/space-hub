import { analyticsService } from "@/entities/analytics/analytics.service";
import { analyticsQuerySchema } from "@/entities/analytics/analytics.schema";
import { GraphQLContext } from "@/graphql/graphql.types";
import { parseInput, requireAdminUser, withoutNulls } from "@/graphql/guards";

/** Query `occupancyAnalytics`. Admin only. Delegates to `analyticsService`. */
export const analyticsResolvers = {
  /**
   * Query `occupancyAnalytics(from, to, groupBy)`: occupancy (global, by location and by space type),
   * revenue (total and per period), memberships expiring soon and top bookers. Admin only.
   */
  occupancyAnalytics: async (args: Record<string, unknown>, context: GraphQLContext) => {
    requireAdminUser(context);
    return analyticsService.dashboard(parseInput(analyticsQuerySchema, withoutNulls(args)));
  },
};
