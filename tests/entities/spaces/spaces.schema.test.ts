import { describe, it, expect } from "vitest";
import {
  createSpaceSchema,
  listSpacesQuerySchema,
  updateSpaceSchema,
} from "@/entities/spaces/spaces.schema";

const valid = {
  name: " Sala ",
  type: "MEETING_ROOM",
  capacity: 8,
  pricePerHour: 45,
  location: "P2",
};

describe("createSpaceSchema", () => {
  it("accepts a valid body and trims strings", () => {
    expect(createSpaceSchema.parse(valid).name).toBe("Sala");
  });

  it.each([{ type: "ROOFTOP" }, { capacity: 0 }, { pricePerHour: 1.5 }, { name: "" }])(
    "rejects %j",
    (patch) => {
      expect(createSpaceSchema.safeParse({ ...valid, ...patch }).success).toBe(false);
    }
  );
});

describe("updateSpaceSchema", () => {
  it("accepts any subset but not an empty object", () => {
    expect(updateSpaceSchema.safeParse({ capacity: 3 }).success).toBe(true);
    expect(updateSpaceSchema.safeParse({}).success).toBe(false);
  });
});

describe("listSpacesQuerySchema", () => {
  it("coerces minCapacity and validates date format", () => {
    expect(listSpacesQuerySchema.parse({ minCapacity: "4", date: "2030-01-01" })).toEqual({
      minCapacity: 4,
      date: "2030-01-01",
    });
    expect(listSpacesQuerySchema.safeParse({ date: "01/01/2030" }).success).toBe(false);
    expect(listSpacesQuerySchema.safeParse({}).success).toBe(true);
  });
});
