import prisma from "@/lib/prisma";
import { SpaceType } from "@prisma/client";
import { formatDates } from "@/core/utils/format-dates";

export const spacesResolvers = {
  spaces: async ({ type, minCapacity }: { type?: SpaceType; minCapacity?: number }) => {
    return formatDates(
      await prisma.space.findMany({
        where: {
          ...(type && { type }),
          ...(minCapacity && { capacity: { gte: minCapacity } }),
        },
        include: { bookings: { include: { user: true } } },
      })
    );
  },

  space: async ({ id }: { id: string }) => {
    return formatDates(
      await prisma.space.findUnique({
        where: { id: parseInt(id) },
        include: { bookings: { include: { user: true } } },
      })
    );
  },
};