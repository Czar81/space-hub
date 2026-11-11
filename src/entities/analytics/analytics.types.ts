import { z } from "zod";
import { SpaceType } from "@prisma/client";
import { analyticsQuerySchema, REVENUE_GRANULARITIES } from "@/entities/analytics/analytics.schema";

export type AnalyticsQuery = z.infer<typeof analyticsQuerySchema>;
export type RevenueGranularity = (typeof REVENUE_GRANULARITIES)[number];

/** Row of the occupancy query: hours booked on one active space inside the period. */
export interface SpaceOccupancyRow {
  id: number;
  location: string;
  type: SpaceType;
  bookedHours: number;
}

/** Row of the revenue query: one bucket of the series. */
export interface RevenueRow {
  periodStart: Date;
  revenue: number;
  bookings: number;
}

/** Booked vs available hours of a group of spaces. */
export interface OccupancyFigures {
  totalSpaces: number;
  bookedHours: number;
  availableHours: number;
  /** bookedHours / availableHours x 100, between 0 and 100. */
  occupancyRate: number;
}
