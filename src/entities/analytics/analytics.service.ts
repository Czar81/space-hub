import prisma from "@/lib/prisma";
import { BookingStatus, SpaceType } from "@prisma/client";
import {
  AnalyticsQuery,
  OccupancyFigures,
  RevenueGranularity,
  RevenueRow,
  SpaceOccupancyRow,
} from "@/entities/analytics/analytics.types";

const MS_PER_HOUR = 60 * 60 * 1000;
const MS_PER_DAY = 24 * MS_PER_HOUR;
/** Window used by `membershipsExpiringSoon`. */
const EXPIRING_SOON_DAYS = 7;
/** Size of the `topUsers` ranking. */
const TOP_USERS_LIMIT = 5;

/** Postgres `date_trunc` unit for each granularity. */
const TRUNC_UNIT: Record<RevenueGranularity, string> = { DAY: "day", WEEK: "week", MONTH: "month" };

const round2 = (value: number) => Math.round(value * 100) / 100;

/**
 * Start of the bucket that contains `date`, in UTC. Weeks start on Monday, like Postgres `date_trunc`.
 *
 * @param date Any instant.
 * @param granularity Bucket size.
 * @returns The first instant of the bucket.
 */
export const truncateToPeriod = (date: Date, granularity: RevenueGranularity) => {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth();
  const d = date.getUTCDate();

  if (granularity === "MONTH") return new Date(Date.UTC(y, m, 1));
  if (granularity === "WEEK") return new Date(Date.UTC(y, m, d - ((date.getUTCDay() + 6) % 7)));
  return new Date(Date.UTC(y, m, d));
};

/** Start of the bucket after `periodStart`. */
const nextPeriod = (periodStart: Date, granularity: RevenueGranularity) => {
  if (granularity === "MONTH") {
    return new Date(Date.UTC(periodStart.getUTCFullYear(), periodStart.getUTCMonth() + 1, 1));
  }
  const days = granularity === "WEEK" ? 7 : 1;
  return new Date(periodStart.getTime() + days * MS_PER_DAY);
};

/**
 * Occupancy of a group of spaces: hours booked over hours the spaces could have been booked.
 *
 * @param rows Spaces of the group with their booked hours.
 * @param periodHours Length of the period in hours.
 * @returns Booked and available hours and the rate, never above 100.
 */
export const computeOccupancy = (
  rows: SpaceOccupancyRow[],
  periodHours: number
): OccupancyFigures => {
  const bookedHours = rows.reduce((sum, row) => sum + Number(row.bookedHours), 0);
  const availableHours = rows.length * periodHours;
  const rate = availableHours > 0 ? (bookedHours / availableHours) * 100 : 0;

  return {
    totalSpaces: rows.length,
    bookedHours: round2(bookedHours),
    availableHours: round2(availableHours),
    occupancyRate: round2(Math.min(rate, 100)),
  };
};

/** Groups rows by a key and computes the occupancy of each group, sorted by key. */
const occupancyBy = <K extends string>(
  rows: SpaceOccupancyRow[],
  periodHours: number,
  keyOf: (row: SpaceOccupancyRow) => K
) => {
  const groups = new Map<K, SpaceOccupancyRow[]>();
  for (const row of rows) {
    const key = keyOf(row);
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }

  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, groupRows]) => ({ key, ...computeOccupancy(groupRows, periodHours) }));
};

/**
 * Admin dashboard figures. Only CONFIRMED bookings count; canceled and pending ones are ignored.
 * Occupancy = booked hours / (active spaces x hours of the period), with each booking clipped to the period.
 */
export const analyticsService = {
  /**
   * Hours booked on every active space inside `[from, to)`, computed in the database.
   * Bookings that cross the edges of the period only count the part inside it.
   *
   * @param from Start of the period (inclusive).
   * @param to End of the period (exclusive).
   * @returns One row per active space.
   */
  async spaceOccupancy(from: Date, to: Date) {
    // Prisma stores DateTime as UTC `timestamp` columns, so the ISO strings are cast without a zone
    const fromTs = from.toISOString();
    const toTs = to.toISOString();

    return prisma.$queryRaw<SpaceOccupancyRow[]>`
      SELECT s."id",
             s."location",
             s."type"::text AS "type",
             -- FILTER is required: LEAST/GREATEST ignore NULLs, so a space without bookings
             -- (NULL row from the LEFT JOIN) would otherwise count the whole period as booked
             COALESCE(SUM(EXTRACT(EPOCH FROM (
               LEAST(b."endTime", ${toTs}::timestamp) - GREATEST(b."startTime", ${fromTs}::timestamp)
             ))) FILTER (WHERE b."id" IS NOT NULL), 0)::float8 / 3600 AS "bookedHours"
      FROM "Space" s
      LEFT JOIN "Booking" b
        ON b."spaceId" = s."id"
       AND b."status" = 'CONFIRMED'
       AND b."startTime" < ${toTs}::timestamp
       AND b."endTime" > ${fromTs}::timestamp
      WHERE s."isActive" = true
      GROUP BY s."id"
      ORDER BY s."id"
    `;
  },

  /**
   * Revenue of the bookings that start inside `[from, to)`, one entry per bucket.
   * Buckets without bookings are returned with zero so the series has no gaps.
   *
   * @param from Start of the period (inclusive).
   * @param to End of the period (exclusive).
   * @param granularity Bucket size.
   * @returns The series ordered by `periodStart`.
   */
  async revenueSeries(from: Date, to: Date, granularity: RevenueGranularity) {
    const rows = await prisma.$queryRaw<RevenueRow[]>`
      SELECT date_trunc(${TRUNC_UNIT[granularity]}, "startTime") AS "periodStart",
             SUM("totalPrice")::float8 AS "revenue",
             COUNT(*)::int AS "bookings"
      FROM "Booking"
      WHERE "status" = 'CONFIRMED'
        AND "startTime" >= ${from.toISOString()}::timestamp
        AND "startTime" < ${to.toISOString()}::timestamp
      GROUP BY 1
      ORDER BY 1
    `;

    const byPeriod = new Map(rows.map((row) => [new Date(row.periodStart).getTime(), row]));
    const series = [];

    for (
      let periodStart = truncateToPeriod(from, granularity);
      periodStart < to;
      periodStart = nextPeriod(periodStart, granularity)
    ) {
      const row = byPeriod.get(periodStart.getTime());
      series.push({
        periodStart: periodStart.toISOString(),
        revenue: round2(Number(row?.revenue ?? 0)),
        bookings: Number(row?.bookings ?? 0),
      });
    }

    return series;
  },

  /**
   * Users with the most confirmed bookings in the period, keeping the ranking order.
   *
   * @param from Start of the period (inclusive).
   * @param to End of the period (exclusive).
   * @returns Up to five `{ user, bookings }`, most bookings first (ties by user id).
   */
  async topUsers(from: Date, to: Date) {
    const ranking = await prisma.booking.groupBy({
      by: ["userId"],
      where: { status: BookingStatus.CONFIRMED, startTime: { gte: from, lt: to } },
      _count: { id: true },
      orderBy: [{ _count: { id: "desc" } }, { userId: "asc" }],
      take: TOP_USERS_LIMIT,
    });

    const users = await prisma.user.findMany({
      where: { id: { in: ranking.map((entry) => entry.userId) } },
      select: { id: true, name: true, email: true, role: true },
    });
    const usersById = new Map(users.map((user) => [user.id, user]));

    // `findMany` with `in` does not keep the order of the ranking, so it is rebuilt from `groupBy`
    return ranking
      .filter((entry) => usersById.has(entry.userId))
      .map((entry) => ({ user: usersById.get(entry.userId), bookings: entry._count.id }));
  },

  /**
   * Builds the whole dashboard for a period.
   *
   * @param query Validated period and revenue granularity.
   * @returns Occupancy (global, by location, by space type), revenue (total and series),
   * memberships expiring in the next 7 days and the top bookers.
   */
  async dashboard({ from, to, groupBy }: AnalyticsQuery) {
    const now = new Date();
    const soon = new Date(now.getTime() + EXPIRING_SOON_DAYS * MS_PER_DAY);
    const periodHours = (to.getTime() - from.getTime()) / MS_PER_HOUR;

    const [spaces, revenue, revenueByPeriod, membershipsExpiringSoon, topUsers] = await Promise.all(
      [
        this.spaceOccupancy(from, to),
        prisma.booking.aggregate({
          where: { status: BookingStatus.CONFIRMED, startTime: { gte: from, lt: to } },
          _sum: { totalPrice: true },
        }),
        this.revenueSeries(from, to, groupBy),
        // Already expired memberships are not "expiring soon"
        prisma.membership.count({ where: { endDate: { gte: now, lte: soon } } }),
        this.topUsers(from, to),
      ]
    );

    return {
      period: { from: from.toISOString(), to: to.toISOString() },
      ...computeOccupancy(spaces, periodHours),
      occupancyByLocation: occupancyBy(spaces, periodHours, (row) => row.location).map(
        ({ key, ...figures }) => ({ location: key, ...figures })
      ),
      occupancyBySpaceType: occupancyBy(spaces, periodHours, (row) => row.type).map(
        ({ key, ...figures }) => ({ type: key as SpaceType, ...figures })
      ),
      totalRevenue: round2(Number(revenue._sum.totalPrice ?? 0)),
      revenueByPeriod,
      membershipsExpiringSoon,
      topUsers,
    };
  },
};
