import { describe, it, expect } from "vitest";
import { z } from "zod";
import { UserRole } from "@prisma/client";
import { parseId, parseInput, requireAdminUser, requireUser } from "@/graphql/guards";
import { AppError } from "@/core/utils/app-error";
import { MAX_DB_INT } from "@/core/schemas/id-param.schema";

const jwtUser = (role: UserRole) =>
  ({ userId: 1, email: "a@test.com", role, type: "access" }) as const;

describe("requireUser", () => {
  it("re-throws the authError stored in the context", () => {
    const authError = AppError.unauthorized("Invalid or expired token");
    expect(() => requireUser({ user: null, authError })).toThrow(authError);
  });

  it("401 for anonymous context", () => {
    expect(() => requireUser({ user: null })).toThrow("Authentication token required");
  });

  it("returns the user", () => {
    const user = jwtUser(UserRole.MEMBER);
    expect(requireUser({ user })).toBe(user);
  });
});

describe("requireAdminUser", () => {
  it("403 for members", () => {
    expect(() => requireAdminUser({ user: jwtUser(UserRole.MEMBER) })).toThrow(
      expect.objectContaining({ statusCode: 403 })
    );
  });

  it("401 for anonymous", () => {
    expect(() => requireAdminUser({ user: null })).toThrow(
      expect.objectContaining({ statusCode: 401 })
    );
  });

  it("returns an admin", () => {
    expect(requireAdminUser({ user: jwtUser(UserRole.ADMIN) }).role).toBe(UserRole.ADMIN);
  });
});

describe("parseInput", () => {
  const schema = z.object({ n: z.number() });

  it("returns parsed data", () => {
    expect(parseInput(schema, { n: 1 })).toEqual({ n: 1 });
  });

  it("400 with the Zod issues in details", () => {
    try {
      parseInput(schema, { n: "x" });
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(AppError);
      expect((e as AppError).statusCode).toBe(400);
      expect((e as AppError).details).toHaveLength(1);
    }
  });
});

describe("parseId", () => {
  it("parses a valid id", () => {
    expect(parseId("12")).toBe(12);
    expect(parseId(String(MAX_DB_INT))).toBe(MAX_DB_INT);
  });

  it.each(["0", "-3", "1.5", "abc", "", String(MAX_DB_INT + 1)])("400 for %j", (id) => {
    expect(() => parseId(id)).toThrow(expect.objectContaining({ statusCode: 400 }));
  });

  it("uses the label in the message", () => {
    expect(() => parseId("x", "userId")).toThrow("Invalid userId");
  });
});
