import { describe, it, expect, vi, afterEach } from "vitest";
import { analyticsQuerySchema } from "@/entities/analytics/analytics.schema";

describe("analyticsQuerySchema", () => {
  afterEach(() => vi.useRealTimers());

  it("defaults to the last 30 days grouped by day", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2030-01-31T00:00:00Z"));
    expect(analyticsQuerySchema.parse({})).toEqual({
      from: new Date("2030-01-01T00:00:00Z"),
      to: new Date("2030-01-31T00:00:00Z"),
      groupBy: "DAY",
    });
  });

  it("accepts dates and date-times with offset", () => {
    const res = analyticsQuerySchema.parse({ from: "2030-01-01", to: "2030-01-02T06:00:00-06:00" });
    expect(res.to).toEqual(new Date("2030-01-02T12:00:00Z"));
  });

  it("rejects inverted, too long or malformed periods and unknown granularities", () => {
    expect(analyticsQuerySchema.safeParse({ from: "2030-02-01", to: "2030-01-01" }).success).toBe(
      false
    );
    expect(analyticsQuerySchema.safeParse({ from: "2028-01-01", to: "2030-01-01" }).success).toBe(
      false
    );
    expect(analyticsQuerySchema.safeParse({ from: "yesterday" }).success).toBe(false);
    expect(analyticsQuerySchema.safeParse({ groupBy: "YEAR" }).success).toBe(false);
  });
});
