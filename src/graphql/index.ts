import { spacesResolvers } from "@/graphql/resolvers/spaces.resolver";
import { analyticsResolvers } from "@/graphql/resolvers/analytics.resolver";
import { authResolvers } from "@/graphql/resolvers/auth.resolver";
import { reservationsResolvers } from "@/graphql/resolvers/reservations.resolver";
import { membershipsResolvers } from "@/graphql/resolvers/memberships.resolver";

/** Root resolvers: every query and mutation of `schema.graphql`. */
export const rootValue = {
  ...spacesResolvers,
  ...analyticsResolvers,
  ...authResolvers,
  ...reservationsResolvers,
  ...membershipsResolvers,
};
