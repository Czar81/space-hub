import { describe, it, expect } from "vitest";
import { createBookingSchema } from "@/entities/bookings/bookings.schema";

const future = (hours: number) => new Date(Date.now() + hours * 3600_000).toISOString();

describe("createBookingSchema", () => {
  it("parses ISO dates into Date objects", () => {
    const parsed = createBookingSchema.parse({
      spaceId: 1,
      startTime: future(1),
      endTime: future(2),
    });
    expect(parsed.startTime).toBeInstanceOf(Date);
    expect(parsed.endTime).toBeInstanceOf(Date);
  });

  it("rejects endTime <= startTime", () => {
    const result = createBookingSchema.safeParse({
      spaceId: 1,
      startTime: future(2),
      endTime: future(1),
    });
    expect(result.success).toBe(false);
  });

  it("rejects a startTime in the past", () => {
    const result = createBookingSchema.safeParse({
      spaceId: 1,
      startTime: future(-3),
      endTime: future(-2),
    });
    expect(result.success).toBe(false);
  });

  it.each([{ spaceId: 0 }, { spaceId: 1.5 }, { startTime: "tomorrow" }])("rejects %j", (patch) => {
    expect(
      createBookingSchema.safeParse({
        spaceId: 1,
        startTime: future(1),
        endTime: future(2),
        ...patch,
      }).success
    ).toBe(false);
  });
});
