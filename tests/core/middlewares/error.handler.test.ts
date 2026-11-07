import { describe, it, expect, vi } from "vitest";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { errorHandler } from "@/core/middlewares/error.handler";
import { AppError } from "@/core/utils/app-error";

const call = (err: unknown) => {
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };
  errorHandler(err as Error, { path: "/x" } as never, res as never, vi.fn());
  return { status: res.status.mock.calls[0][0], body: res.json.mock.calls[0][0] };
};

const prismaError = (code: string) =>
  new Prisma.PrismaClientKnownRequestError("x", { code, clientVersion: "5" });

describe("errorHandler", () => {
  it("400 for ZodError with details", () => {
    const result = z.object({ a: z.string() }).safeParse({});
    const { status, body } = call(result.error);
    expect(status).toBe(400);
    expect(body.message).toBe("Validation error");
    expect(body.details).toHaveLength(1);
  });

  it("400 for malformed JSON", () => {
    const { status, body } = call(Object.assign(new Error("x"), { type: "entity.parse.failed" }));
    expect(status).toBe(400);
    expect(body.message).toBe("Malformed JSON body");
  });

  it("maps Prisma P2002 to 409 and P2025 to 404", () => {
    expect(call(prismaError("P2002")).status).toBe(409);
    expect(call(prismaError("P2025")).status).toBe(404);
  });

  it("uses the status of an AppError, with details when present", () => {
    const { status, body } = call(AppError.conflict("taken", { a: 1 }));
    expect(status).toBe(409);
    expect(body).toEqual({ status: "error", message: "taken", details: { a: 1 } });
  });

  it("omits details when the AppError has none", () => {
    expect(call(AppError.notFound("x")).body).not.toHaveProperty("details");
  });

  it("500 for unknown errors without leaking the message or stack outside development", () => {
    const { status, body } = call(new Error("secret"));
    expect(status).toBe(500);
    expect(body).toEqual({ status: "error", message: "Internal server error" });
  });
});
