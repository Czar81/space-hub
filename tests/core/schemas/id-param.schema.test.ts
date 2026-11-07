import { describe, it, expect } from "vitest";
import { idParamSchema, MAX_DB_INT } from "@/core/schemas/id-param.schema";

describe("idParamSchema", () => {
  it("coerces a numeric string", () => {
    expect(idParamSchema.parse({ id: "5" })).toEqual({ id: 5 });
  });

  it.each(["0", "-1", "1.5", "abc", String(MAX_DB_INT + 1)])("rejects %s", (id) => {
    expect(idParamSchema.safeParse({ id }).success).toBe(false);
  });

  it("accepts the max PostgreSQL integer", () => {
    expect(idParamSchema.safeParse({ id: MAX_DB_INT }).success).toBe(true);
  });
});
