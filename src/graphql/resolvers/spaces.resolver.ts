import { UserRole } from "@prisma/client";
import { formatDates } from "@/core/utils/format-dates";
import { spacesService } from "@/entities/spaces/spaces.service";
import { listSpacesQuerySchema } from "@/entities/spaces/spaces.schema";
import { GraphQLContext, IdArgs, SpacesArgs } from "@/graphql/graphql.types";
import { parseId, parseInput, withoutNulls } from "@/graphql/guards";

/** Bookings (with their user) are only exposed to admins, anyone else gets `null`. */
const readOptions = (context: GraphQLContext) => ({
  includeBookings: context.user?.role === UserRole.ADMIN,
});

/**
 * Public queries `spaces` and `space`. Inactive spaces are never returned.
 * Delegates to `spacesService` and validates with the same Zod schema as `GET /api/spaces`.
 */
export const spacesResolvers = {
  /** Query `spaces`: active spaces filtered by type, capacity, `date` or a `startTime`/`endTime` range. */
  spaces: async (args: SpacesArgs, context: GraphQLContext) => {
    const filters = parseInput(listSpacesQuerySchema, withoutNulls({ ...args }));
    return formatDates(await spacesService.list(filters, readOptions(context)));
  },

  /** Query `space`: one active space. Inactive or missing spaces give NOT_FOUND. */
  space: async ({ id }: IdArgs, context: GraphQLContext) =>
    formatDates(await spacesService.getActiveById(parseId(id), readOptions(context))),
};
