import { describe, it, expect } from "vitest";
import {
  updateMembershipSchema,
  userIdParamSchema,
} from "@/entities/memberships/memberships.schema";

describe("updateMembershipSchema", () => {
  it("accepts valid plans only", () => {
    expect(updateMembershipSchema.safeParse({ plan: "PRO" }).success).toBe(true);
    expect(updateMembershipSchema.safeParse({ plan: "GOLD" }).success).toBe(false);
  });
});

describe("userIdParamSchema", () => {
  it("coerces and validates userId", () => {
    expect(userIdParamSchema.parse({ userId: "3" })).toEqual({ userId: 3 });
    expect(userIdParamSchema.safeParse({ userId: "0" }).success).toBe(false);
  });
});
