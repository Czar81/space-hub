import { describe, it, expect, vi } from "vitest";
import { authResolvers } from "@/graphql/resolvers/auth.resolver";
import { authService } from "@/entities/auth/auth.service";

vi.mock("@/entities/auth/auth.service", () => ({
  authService: { register: vi.fn(), login: vi.fn(), refresh: vi.fn() },
}));

describe("authResolvers", () => {
  it("register validates input and delegates", async () => {
    await authResolvers.register({ name: "A", email: "A@Test.com", password: "12345678" });
    expect(authService.register).toHaveBeenCalledWith({
      name: "A",
      email: "a@test.com",
      password: "12345678",
    });
  });

  it("register rejects invalid input with 400 without calling the service", () => {
    expect(() => authResolvers.register({ email: "bad" })).toThrow(
      expect.objectContaining({ statusCode: 400 })
    );
    expect(authService.register).not.toHaveBeenCalled();
  });

  it("login and refreshToken delegate", async () => {
    await authResolvers.login({ email: "a@test.com", password: "x" });
    expect(authService.login).toHaveBeenCalled();
    await authResolvers.refreshToken({ refreshToken: "t" });
    expect(authService.refresh).toHaveBeenCalledWith({ refreshToken: "t" });
  });
});
