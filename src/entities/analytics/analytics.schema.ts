import { z } from "zod";

/** Size of each bucket of the revenue series. */
export const REVENUE_GRANULARITIES = ["DAY", "WEEK", "MONTH"] as const;

/** Default period when `from` is not given. */
export const DEFAULT_PERIOD_DAYS = 30;
/** Longest period accepted, keeps the revenue series bounded. */
export const MAX_PERIOD_DAYS = 366;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** ISO date (`2026-11-01`, read as UTC midnight) or ISO date-time with offset. */
const isoInstant = z
  .union([z.iso.date(), z.iso.datetime({ offset: true })])
  .transform((value) => new Date(value));

/**
 * Arguments of the `occupancyAnalytics` query.
 * `to` defaults to now and `from` to 30 days before `to`; the range is `[from, to)`.
 */
export const analyticsQuerySchema = z
  .object({
    from: isoInstant.optional(),
    to: isoInstant.optional(),
    groupBy: z.enum(REVENUE_GRANULARITIES).default("DAY"),
  })
  .transform(({ from, to, groupBy }) => {
    const end = to ?? new Date();
    const start = from ?? new Date(end.getTime() - DEFAULT_PERIOD_DAYS * MS_PER_DAY);
    return { from: start, to: end, groupBy };
  })
  .refine((data) => data.to > data.from, { message: "to must be after from", path: ["to"] })
  .refine((data) => data.to.getTime() - data.from.getTime() <= MAX_PERIOD_DAYS * MS_PER_DAY, {
    message: `The period cannot be longer than ${MAX_PERIOD_DAYS} days`,
    path: ["from"],
  });
