import prisma from "@/lib/prisma";
import { SpaceType } from "@prisma/client";
import { formatDates } from "@/core/utils/format-dates";
import { AppError } from "@/core/utils/app-error";

export const spacesResolvers = {
  spaces: async ({ type, minCapacity }: { type?: SpaceType; minCapacity?: number }) => {
    try {
      return formatDates(
        await prisma.space.findMany({
          where: {
            ...(type && { type }),
            ...(minCapacity && { capacity: { gte: minCapacity } }),
          },
          include: { bookings: { include: { user: true } } },
        })
      );
    } catch {
      throw AppError.internal("Unable to retrieve spaces");
    }
  },

  space: async ({ id }: { id: string }) => {
    const spaceId = Number(id);

    if (!Number.isInteger(spaceId) || spaceId <= 0) {
      throw AppError.badRequest("Invalid space id");
    }

    try {
      const space = await prisma.space.findUnique({
        where: { id: spaceId },
        include: { bookings: { include: { user: true } } },
      });

      if (!space) {
        throw AppError.notFound("Space not found");
      }

      return formatDates(space);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw AppError.internal("Unable to retrieve space");
    }
  },
};