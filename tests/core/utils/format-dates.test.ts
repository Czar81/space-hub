import { describe, it, expect } from "vitest";
import { Prisma } from "@prisma/client";
import { formatDates } from "@/core/utils/format-dates";

describe("formatDates", () => {
  it("converts dates to ISO strings, also nested and in arrays", () => {
    const date = new Date("2030-01-01T10:00:00Z");
    expect(formatDates({ a: date, b: [{ c: date }] })).toEqual({
      a: "2030-01-01T10:00:00.000Z",
      b: [{ c: "2030-01-01T10:00:00.000Z" }],
    });
  });

  it("converts Decimal to string", () => {
    expect(formatDates({ price: new Prisma.Decimal("67.50") })).toEqual({ price: "67.5" });
  });

  it("returns primitives and null untouched", () => {
    expect(formatDates(null)).toBeNull();
    expect(formatDates(5)).toBe(5);
    expect(formatDates("x")).toBe("x");
  });
});
