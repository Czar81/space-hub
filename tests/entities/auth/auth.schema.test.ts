import { describe, it, expect } from "vitest";
import { loginSchema, refreshSchema, registerSchema } from "@/entities/auth/auth.schema";

describe("registerSchema", () => {
  const valid = { name: "  Ana ", email: "ANA@Test.com", password: "12345678" };

  it("trims the name and normalizes the email", () => {
    const parsed = registerSchema.parse(valid);
    expect(parsed.name).toBe("Ana");
    expect(parsed.email).toBe("ana@test.com");
  });

  it("ignores a role sent by the client", () => {
    expect(registerSchema.parse({ ...valid, role: "ADMIN" })).not.toHaveProperty("role");
  });

  it.each([
    { password: "short" },
    { password: "x".repeat(73) },
    { email: "not-an-email" },
    { name: "   " },
  ])("rejects %j", (patch) => {
    expect(registerSchema.safeParse({ ...valid, ...patch }).success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("normalizes the email and requires a password", () => {
    expect(loginSchema.parse({ email: "A@B.com", password: "x" }).email).toBe("a@b.com");
    expect(loginSchema.safeParse({ email: "a@b.com", password: "" }).success).toBe(false);
  });
});

describe("refreshSchema", () => {
  it("requires a non empty token", () => {
    expect(refreshSchema.safeParse({ refreshToken: "" }).success).toBe(false);
    expect(refreshSchema.safeParse({ refreshToken: "abc" }).success).toBe(true);
  });
});
