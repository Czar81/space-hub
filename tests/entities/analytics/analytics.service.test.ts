import { describe, it, expect, vi } from "vitest";
import { BookingStatus, SpaceType } from "@prisma/client";
import prisma from "@/lib/prisma";
import {
  analyticsService,
  computeOccupancy,
  truncateToPeriod,
} from "@/entities/analytics/analytics.service";

const db = vi.mocked(prisma, true);
const from = new Date("2030-01-01T00:00:00Z");
const to = new Date("2030-01-03T00:00:00Z"); // 48 hours

const row = (id: number, location: string, type: SpaceType, bookedHours: number) => ({
  id,
  location,
  type,
  bookedHours,
});

describe("computeOccupancy", () => {
  it("is booked hours over available hours, not bookings over spaces", () => {
    // 3 bookings on 2 spaces used to give 150%; by hours it is 12 / 96
    const rows = [
      row(1, "A", SpaceType.INDIVIDUAL_DESK, 10),
      row(2, "A", SpaceType.PRIVATE_ROOM, 2),
    ];
    expect(computeOccupancy(rows, 48)).toEqual({
      totalSpaces: 2,
      bookedHours: 12,
      availableHours: 96,
      occupancyRate: 12.5,
    });
  });

  it("is 0 without spaces and never above 100", () => {
    expect(computeOccupancy([], 48).occupancyRate).toBe(0);
    expect(computeOccupancy([row(1, "A", SpaceType.INDIVIDUAL_DESK, 60)], 48).occupancyRate).toBe(
      100
    );
  });
});

describe("truncateToPeriod", () => {
  const date = new Date("2030-01-03T15:30:00Z"); // Thursday
  it("day, Monday based week and month, in UTC", () => {
    expect(truncateToPeriod(date, "DAY")).toEqual(new Date("2030-01-03T00:00:00Z"));
    expect(truncateToPeriod(date, "WEEK")).toEqual(new Date("2029-12-31T00:00:00Z"));
    expect(truncateToPeriod(date, "MONTH")).toEqual(new Date("2030-01-01T00:00:00Z"));
  });
});

describe("analyticsService.revenueSeries", () => {
  it("fills the buckets without bookings with zero", async () => {
    db.$queryRaw.mockResolvedValue([
      { periodStart: new Date("2030-01-02T00:00:00Z"), revenue: 45.5, bookings: 2 },
    ]);
    expect(await analyticsService.revenueSeries(from, to, "DAY")).toEqual([
      { periodStart: "2030-01-01T00:00:00.000Z", revenue: 0, bookings: 0 },
      { periodStart: "2030-01-02T00:00:00.000Z", revenue: 45.5, bookings: 2 },
    ]);
  });

  it("monthly buckets cover the whole period", async () => {
    db.$queryRaw.mockResolvedValue([]);
    const series = await analyticsService.revenueSeries(
      new Date("2030-01-15T00:00:00Z"),
      new Date("2030-03-02T00:00:00Z"),
      "MONTH"
    );
    expect(series.map((p) => p.periodStart)).toEqual([
      "2030-01-01T00:00:00.000Z",
      "2030-02-01T00:00:00.000Z",
      "2030-03-01T00:00:00.000Z",
    ]);
  });
});

describe("analyticsService.topUsers", () => {
  it("keeps the groupBy order, adds the count and only counts confirmed bookings", async () => {
    db.booking.groupBy.mockResolvedValue([
      { userId: 3, _count: { id: 5 } },
      { userId: 1, _count: { id: 2 } },
    ] as never);
    // `findMany` with `in` returns rows in any order
    db.user.findMany.mockResolvedValue([
      { id: 1, name: "Ana" },
      { id: 3, name: "Luis" },
    ] as never);

    expect(await analyticsService.topUsers(from, to)).toEqual([
      { user: { id: 3, name: "Luis" }, bookings: 5 },
      { user: { id: 1, name: "Ana" }, bookings: 2 },
    ]);
    expect(db.booking.groupBy.mock.calls[0][0].where).toEqual({
      status: BookingStatus.CONFIRMED,
      startTime: { gte: from, lt: to },
    });
  });
});

describe("analyticsService.dashboard", () => {
  it("combines occupancy breakdowns, aggregated revenue, expiring memberships and top users", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2030-01-10T00:00:00Z"));

    db.$queryRaw
      .mockResolvedValueOnce([
        row(1, "Sede Centro", SpaceType.INDIVIDUAL_DESK, 24),
        row(2, "Sede Centro", SpaceType.PRIVATE_ROOM, 12),
        row(3, "Sede Norte", SpaceType.PRIVATE_ROOM, 0),
      ])
      .mockResolvedValueOnce([]);
    db.booking.aggregate.mockResolvedValue({ _sum: { totalPrice: "150.50" } } as never);
    db.membership.count.mockResolvedValue(2);
    db.booking.groupBy.mockResolvedValue([]);
    db.user.findMany.mockResolvedValue([]);

    const res = await analyticsService.dashboard({ from, to, groupBy: "DAY" });

    expect(res).toMatchObject({
      period: { from: from.toISOString(), to: to.toISOString() },
      totalSpaces: 3,
      bookedHours: 36,
      availableHours: 144,
      occupancyRate: 25,
      occupancyByLocation: [
        { location: "Sede Centro", totalSpaces: 2, bookedHours: 36, occupancyRate: 37.5 },
        { location: "Sede Norte", totalSpaces: 1, bookedHours: 0, occupancyRate: 0 },
      ],
      occupancyBySpaceType: [
        { type: SpaceType.INDIVIDUAL_DESK, totalSpaces: 1, occupancyRate: 50 },
        { type: SpaceType.PRIVATE_ROOM, totalSpaces: 2, occupancyRate: 12.5 },
      ],
      totalRevenue: 150.5,
      membershipsExpiringSoon: 2,
      topUsers: [],
    });
    expect(res.revenueByPeriod).toHaveLength(2);

    // Revenue is aggregated in the database, not by loading every booking
    expect(db.booking.findMany).not.toHaveBeenCalled();
    expect(db.booking.aggregate.mock.calls[0][0]).toEqual({
      where: { status: BookingStatus.CONFIRMED, startTime: { gte: from, lt: to } },
      _sum: { totalPrice: true },
    });
    // Already expired memberships are excluded
    expect(db.membership.count).toHaveBeenCalledWith({
      where: {
        endDate: {
          gte: new Date("2030-01-10T00:00:00Z"),
          lte: new Date("2030-01-17T00:00:00Z"),
        },
      },
    });
    vi.useRealTimers();
  });

  it("revenue is 0 when there are no bookings", async () => {
    db.$queryRaw.mockResolvedValue([]);
    db.booking.aggregate.mockResolvedValue({ _sum: { totalPrice: null } } as never);
    db.membership.count.mockResolvedValue(0);
    db.booking.groupBy.mockResolvedValue([]);
    db.user.findMany.mockResolvedValue([]);
    const res = await analyticsService.dashboard({ from, to, groupBy: "DAY" });
    expect(res.totalRevenue).toBe(0);
    expect(res.occupancyRate).toBe(0);
  });
});
