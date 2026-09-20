import { spacesResolvers } from "@/graphql/resolvers/spaces.resolver";
import { analyticsResolvers } from "@/graphql/resolvers/analytics.resolver";
// import { authResolvers } from "./auth.resolver";
// import { reservationsResolvers } from "./reservations.resolver";
// import { membershipsResolvers } from "./memberships.resolver";

export const rootValue = {
  ...spacesResolvers,
  ...analyticsResolvers,
  // ...authResolvers,
  // ...reservationsResolvers,
  // ...membershipsResolvers,
};