import { describe, it, expect } from "vitest";
import { UserRole } from "@prisma/client";
import { createContext } from "@/graphql/context";
import { jwtService } from "@/core/services/jwt/jwt.service";

describe("createContext", () => {
  it("anonymous context without a token", () => {
    expect(createContext({})).toEqual({ user: null });
  });

  it("loads the user from a valid access token", () => {
    const token = jwtService.sign({ userId: 5, email: "a@test.com", role: UserRole.ADMIN });
    expect(createContext({ authorization: `Bearer ${token}` }).user).toMatchObject({
      userId: 5,
      role: UserRole.ADMIN,
    });
  });

  it("stores authError instead of throwing for an invalid token", () => {
    const ctx = createContext({ authorization: "Bearer garbage" });
    expect(ctx.user).toBeNull();
    expect(ctx.authError?.statusCode).toBe(401);
  });

  it("a refresh token is not valid as access token", () => {
    const token = jwtService.signRefresh({ userId: 5, email: "a@test.com", role: UserRole.MEMBER });
    expect(createContext({ authorization: `Bearer ${token}` }).authError).toBeDefined();
  });
});
