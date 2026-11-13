import { z } from "zod";
import {
  createSpaceSchema,
  updateSpaceSchema,
  listSpacesQuerySchema,
} from "@/entities/spaces/spaces.schema";

export type CreateSpaceBody = z.infer<typeof createSpaceSchema>;
export type UpdateSpaceBody = z.infer<typeof updateSpaceSchema>;
export type ListSpacesQuery = z.infer<typeof listSpacesQuerySchema>;

/** Read options shared by the REST routes and the GraphQL resolvers. */
export interface SpaceReadOptions {
  /** Adds the bookings of the space with their user. Only for admins. */
  includeBookings?: boolean;
}
