import prisma from "@/lib/prisma";
import { BookingStatus } from "@prisma/client";
import { AppError } from "@/core/utils/app-error";

export const analyticsResolvers = {
  occupancyAnalytics: async () => {
    try {
      const spaces = await prisma.space.findMany();
      const totalSpaces = spaces.length;

      const confirmedBookings = await prisma.booking.findMany({
        where: { status: BookingStatus.CONFIRMED },
      });

      const occupancyRate = totalSpaces > 0
        ? (confirmedBookings.length / totalSpaces) * 100
        : 0;

      const totalRevenue = confirmedBookings.reduce(
        (sum, b) => sum + parseFloat(b.totalPrice?.toString() || "0"),
        0
      );

      const soon = new Date();
      soon.setDate(soon.getDate() + 7);
      const expiringList = await prisma.membership.findMany({
        where: { endDate: { lte: soon } },
      });
      const membershipsExpiringSoon = expiringList.length;

      const topBookers = await prisma.booking.groupBy({
        by: ["userId"],
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 5,
      });

      const topUsersData = await prisma.user.findMany({
        where: { id: { in: topBookers.map((b) => b.userId) } },
      });

      const topUsers = topUsersData.map((u) => u.name);

      return {
        totalSpaces,
        occupancyRate,
        totalRevenue,
        membershipsExpiringSoon,
        topUsers,
      };
    } catch {
      throw AppError.internal("Unable to retrieve occupancy analytics");
    }
  },
};