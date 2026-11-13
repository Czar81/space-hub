import { describe, it, expect } from "vitest";
import jwt from "jsonwebtoken";
import { UserRole } from "@prisma/client";
import { jwtService } from "@/core/services/jwt/jwt.service";
import { AppError } from "@/core/utils/app-error";

const payload = { userId: 1, email: "a@test.com", role: UserRole.MEMBER };

describe("jwtService", () => {
  it("signs and verifies an access token", () => {
    const decoded = jwtService.verify(jwtService.sign(payload));
    expect(decoded).toMatchObject({ ...payload, type: "access" });
  });

  it("verifies a refresh token only as refresh", () => {
    const token = jwtService.signRefresh(payload);
    expect(jwtService.verify(token, "refresh").type).toBe("refresh");
    expect(() => jwtService.verify(token)).toThrow(AppError);
  });

  it("rejects an access token used as refresh", () => {
    expect(() => jwtService.verify(jwtService.sign(payload), "refresh")).toThrow(
      "Invalid token payload"
    );
  });

  it("rejects garbage and tokens signed with another secret", () => {
    expect(() => jwtService.verify("garbage")).toThrow("Invalid or expired token");
    const forged = jwt.sign({ ...payload, type: "access" }, "other-secret-value");
    expect(() => jwtService.verify(forged)).toThrow("Invalid or expired token");
  });

  it("rejects expired tokens", () => {
    const expired = jwt.sign({ ...payload, type: "access" }, process.env.JWT_SECRET!, {
      expiresIn: -10,
    });
    expect(() => jwtService.verify(expired)).toThrow("Invalid or expired token");
  });

  it("rejects the none algorithm", () => {
    const none = jwt.sign({ ...payload, type: "access" }, "", { algorithm: "none" });
    expect(() => jwtService.verify(none)).toThrow(AppError);
  });

  describe("extractToken", () => {
    it("reads a Bearer token", () => {
      expect(jwtService.extractToken("Bearer abc")).toBe("abc");
    });

    it.each([undefined, "", "abc", "Basic abc", "Bearer "])("returns null for %j", (header) => {
      expect(jwtService.extractToken(header)).toBeNull();
    });
  });
});
