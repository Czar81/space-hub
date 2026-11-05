import { formatDates } from "@/core/utils/format-dates";
import { bookingsService } from "@/entities/bookings/bookings.service";
import { createBookingSchema } from "@/entities/bookings/bookings.schema";
import { GraphQLContext, IdArgs } from "@/graphql/graphql.types";
import { parseId, parseInput, requireUser } from "@/graphql/guards";

/**
 * Queries `bookings`/`booking` and mutations `createBooking`/`cancelBooking`.
 * Authenticated; members only reach their own bookings. Delegates to `bookingsService`.
 */
export const reservationsResolvers = {
  /** Query `bookings`: own bookings for members, every booking for admins. */
  bookings: async (_args: unknown, context: GraphQLContext) =>
    formatDates(await bookingsService.list(requireUser(context))),

  /** Query `booking`: one booking. Members cannot see other users' bookings (NOT_FOUND). */
  booking: async ({ id }: IdArgs, context: GraphQLContext) =>
    formatDates(await bookingsService.getById(requireUser(context), parseId(id))),

  /**
   * Mutation `createBooking`: books a space; fails with CONFLICT when the range overlaps an active booking.
   */
  createBooking: async (args: unknown, context: GraphQLContext) => {
    const user = requireUser(context);
    return formatDates(await bookingsService.create(user, parseInput(createBookingSchema, args)));
  },

  /** Mutation `cancelBooking`: cancels an own booking (any booking for admins). */
  cancelBooking: async ({ id }: IdArgs, context: GraphQLContext) =>
    formatDates(await bookingsService.cancel(requireUser(context), parseId(id))),
};
