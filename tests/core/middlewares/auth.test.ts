import { describe, it, expect, vi } from "vitest";
import { UserRole } from "@prisma/client";
import { authenticate, authorize, requireAdmin } from "@/core/middlewares/auth";
import { jwtService } from "@/core/services/jwt/jwt.service";
import { AppError } from "@/core/utils/app-error";

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
const run = (mw: Function, req: object) => {
  const next = vi.fn();
  mw(req, {}, next);
  return next;
};

describe("authenticate", () => {
  it("401 without a token", () => {
    const next = run(authenticate, { headers: {} });
    expect((next.mock.calls[0][0] as AppError).statusCode).toBe(401);
  });

  it("stores the payload in req.user on success", () => {
    const token = jwtService.sign({ userId: 1, email: "a@test.com", role: UserRole.MEMBER });
    const req: { headers: object; user?: { userId: number } } = {
      headers: { authorization: `Bearer ${token}` },
    };
    const next = run(authenticate, req);
    expect(next).toHaveBeenCalledWith();
    expect(req.user?.userId).toBe(1);
  });

  it("forwards the error for an invalid token", () => {
    const next = run(authenticate, { headers: { authorization: "Bearer bad" } });
    expect((next.mock.calls[0][0] as AppError).statusCode).toBe(401);
  });
});

describe("authorize / requireAdmin", () => {
  it("401 when req.user is missing", () => {
    const next = run(authorize(UserRole.ADMIN), {});
    expect((next.mock.calls[0][0] as AppError).statusCode).toBe(401);
  });

  it("403 when the role is not allowed", () => {
    const next = run(requireAdmin, { user: { role: UserRole.MEMBER } });
    expect((next.mock.calls[0][0] as AppError).statusCode).toBe(403);
  });

  it("passes when the role is allowed", () => {
    expect(run(requireAdmin, { user: { role: UserRole.ADMIN } })).toHaveBeenCalledWith();
    expect(
      run(authorize(UserRole.ADMIN, UserRole.MEMBER), { user: { role: UserRole.MEMBER } })
    ).toHaveBeenCalledWith();
  });
});
