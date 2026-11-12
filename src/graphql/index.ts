import { spacesResolvers } from "@/graphql/resolvers/spaces.resolver";
import { analyticsResolvers } from "@/graphql/resolvers/analytics.resolver";
import { authResolvers } from "@/graphql/resolvers/auth.resolver";
import { reservationsResolvers } from "@/graphql/resolvers/reservations.resolver";
import { membershipsResolvers } from "@/graphql/resolvers/memberships.resolver";
import { availabilitySubscriptions } from "@/graphql/resolvers/availability.resolver";

/** Root resolvers for HTTP: every query and mutation of `schema.graphql`. */
export const rootValue = {
  ...spacesResolvers,
  ...analyticsResolvers,
  ...authResolvers,
  ...reservationsResolvers,
  ...membershipsResolvers,
};

/** Root resolvers for the WebSocket server: every subscription of `schema.graphql`. */
export const subscriptionRoot = {
  ...availabilitySubscriptions,
};
