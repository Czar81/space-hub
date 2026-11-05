import prisma from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { formatDates } from "@/core/utils/format-dates";
import { AppError } from "@/core/utils/app-error";
import { GraphQLContext, IdArgs, SpacesArgs } from "@/graphql/graphql.types";

/** Bookings (with their user) are only exposed to admins, anyone else gets `null`. */
const bookingsInclude = (context: GraphQLContext) =>
  context.user?.role === UserRole.ADMIN
    ? {
        bookings: {
          include: {
            user: { select: { id: true, name: true, email: true, role: true } },
          },
        },
      }
    : {};

/** Public queries `spaces` and `space`. Inactive spaces are never returned. */
export const spacesResolvers = {
  /** Query `spaces`: active spaces, optionally filtered by type and minimum capacity. */
  spaces: async ({ type, minCapacity }: SpacesArgs, context: GraphQLContext) => {
    try {
      return formatDates(
        await prisma.space.findMany({
          where: {
            isActive: true,
            ...(type && { type }),
            ...(minCapacity && { capacity: { gte: minCapacity } }),
          },
          include: bookingsInclude(context),
        })
      );
    } catch {
      throw AppError.internal("Unable to retrieve spaces");
    }
  },

  /** Query `space`: one active space. Inactive or missing spaces give NOT_FOUND. */
  space: async ({ id }: IdArgs, context: GraphQLContext) => {
    const spaceId = Number(id);

    if (!Number.isInteger(spaceId) || spaceId <= 0) {
      throw AppError.badRequest("Invalid space id");
    }

    try {
      const space = await prisma.space.findUnique({
        where: { id: spaceId },
        include: bookingsInclude(context),
      });

      if (!space || !space.isActive) {
        throw AppError.notFound("Space not found");
      }

      return formatDates(space);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw AppError.internal("Unable to retrieve space");
    }
  },
};
