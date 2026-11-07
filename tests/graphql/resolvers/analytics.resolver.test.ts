import { describe, it, expect, vi } from "vitest";
import { UserRole } from "@prisma/client";
import prisma from "@/lib/prisma";
import { analyticsResolvers } from "@/graphql/resolvers/analytics.resolver";

const db = vi.mocked(prisma, true);
const ctx = (role: UserRole) => ({
  user: { userId: 1, email: "a@test.com", role, type: "access" as const },
});

describe("analyticsResolvers.occupancyAnalytics", () => {
  it("is admin only", async () => {
    await expect(
      analyticsResolvers.occupancyAnalytics({}, ctx(UserRole.MEMBER))
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(db.space.findMany).not.toHaveBeenCalled();
  });

  it("computes occupancy, revenue, expiring memberships and top users", async () => {
    db.space.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }] as never);
    db.booking.findMany.mockResolvedValue([
      { totalPrice: "10.50" },
      { totalPrice: "4.50" },
    ] as never);
    db.membership.findMany.mockResolvedValue([{ id: 1 }] as never);
    db.booking.groupBy.mockResolvedValue([{ userId: 2 }] as never);
    db.user.findMany.mockResolvedValue([{ id: 2, name: "Luis" }] as never);

    expect(await analyticsResolvers.occupancyAnalytics({}, ctx(UserRole.ADMIN))).toEqual({
      totalSpaces: 4,
      occupancyRate: 50,
      totalRevenue: 15,
      membershipsExpiringSoon: 1,
      topUsers: ["Luis"],
    });
  });

  it("occupancy is 0 (not NaN) without spaces", async () => {
    db.space.findMany.mockResolvedValue([]);
    db.booking.findMany.mockResolvedValue([]);
    db.membership.findMany.mockResolvedValue([]);
    db.booking.groupBy.mockResolvedValue([]);
    db.user.findMany.mockResolvedValue([]);
    const res = await analyticsResolvers.occupancyAnalytics({}, ctx(UserRole.ADMIN));
    expect(res.occupancyRate).toBe(0);
    expect(res.totalRevenue).toBe(0);
  });

  it("500 when the database fails", async () => {
    db.space.findMany.mockRejectedValue(new Error("db"));
    await expect(
      analyticsResolvers.occupancyAnalytics({}, ctx(UserRole.ADMIN))
    ).rejects.toMatchObject({ statusCode: 500 });
  });
});
