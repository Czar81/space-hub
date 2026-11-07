import { describe, it, expect } from "vitest";
import { AppError } from "@/core/utils/app-error";

describe("AppError", () => {
  it.each([
    ["badRequest", () => AppError.badRequest("x"), 400, true],
    ["unauthorized", () => AppError.unauthorized(), 401, true],
    ["forbidden", () => AppError.forbidden(), 403, true],
    ["notFound", () => AppError.notFound(), 404, true],
    ["conflict", () => AppError.conflict("x"), 409, true],
    ["tooManyRequests", () => AppError.tooManyRequests(), 429, true],
    ["internal", () => AppError.internal(), 500, false],
  ])("%s sets the right status and operational flag", (_n, build, status, operational) => {
    const err = build();
    expect(err).toBeInstanceOf(AppError);
    expect(err).toBeInstanceOf(Error);
    expect(err.statusCode).toBe(status);
    expect(err.isOperational).toBe(operational);
  });

  it("keeps custom message and details", () => {
    const err = AppError.badRequest("bad", [{ field: "a" }]);
    expect(err.message).toBe("bad");
    expect(err.details).toEqual([{ field: "a" }]);
  });
});
