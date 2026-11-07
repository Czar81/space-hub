import { describe, it, expect, vi } from "vitest";
import { authService } from "@/entities/auth/auth.service";
import { usersService } from "@/entities/users/users.service";
import { jwtService } from "@/core/services/jwt/jwt.service";
import { makeUser } from "../../helpers/factories";

vi.mock("@/entities/users/users.service", () => ({
  usersService: {
    create: vi.fn(),
    findByEmail: vi.fn(),
    findById: vi.fn(),
    verifyPassword: vi.fn(),
    toPublic: vi.fn((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role })),
  },
}));

const users = vi.mocked(usersService);

describe("authService", () => {
  it("register returns the public user and a token pair", async () => {
    users.create.mockResolvedValue(makeUser());
    const res = await authService.register({ name: "Ana", email: "ana@test.com", password: "x" });
    expect(res.user).not.toHaveProperty("password");
    expect(jwtService.verify(res.token).userId).toBe(1);
    expect(jwtService.verify(res.refreshToken, "refresh").userId).toBe(1);
  });

  describe("login", () => {
    it("returns tokens for valid credentials", async () => {
      users.findByEmail.mockResolvedValue(makeUser());
      users.verifyPassword.mockResolvedValue(true);
      const res = await authService.login({ email: "ana@test.com", password: "ok" });
      expect(res.user.email).toBe("ana@test.com");
    });

    it("same 401 for unknown email and wrong password", async () => {
      users.findByEmail.mockResolvedValue(null);
      const unknown = await authService
        .login({ email: "x@test.com", password: "p" })
        .catch((e) => e);

      users.findByEmail.mockResolvedValue(makeUser());
      users.verifyPassword.mockResolvedValue(false);
      const wrong = await authService
        .login({ email: "ana@test.com", password: "p" })
        .catch((e) => e);

      expect(unknown.statusCode).toBe(401);
      expect(wrong.statusCode).toBe(401);
      expect(unknown.message).toBe(wrong.message);
    });
  });

  describe("refresh", () => {
    const refreshToken = () =>
      jwtService.signRefresh({ userId: 1, email: "ana@test.com", role: "MEMBER" });

    it("issues a new pair using the current user data", async () => {
      users.findById.mockResolvedValue(makeUser({ role: "ADMIN" }));
      const res = await authService.refresh({ refreshToken: refreshToken() });
      expect(jwtService.verify(res.token).role).toBe("ADMIN");
    });

    it("401 when the user no longer exists", async () => {
      users.findById.mockResolvedValue(null);
      await expect(authService.refresh({ refreshToken: refreshToken() })).rejects.toMatchObject({
        statusCode: 401,
      });
    });

    it("401 when an access token is sent as refresh", async () => {
      const access = jwtService.sign({ userId: 1, email: "a@test.com", role: "MEMBER" });
      await expect(authService.refresh({ refreshToken: access })).rejects.toMatchObject({
        statusCode: 401,
      });
    });
  });
});
