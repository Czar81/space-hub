import { describe, it, expect, vi } from "vitest";
import { notFoundHandler } from "@/core/middlewares/not-found.handler";

describe("notFoundHandler", () => {
  it("forwards a 404 naming the route", () => {
    const next = vi.fn();
    notFoundHandler({ method: "GET", originalUrl: "/nope" } as never, {} as never, next);
    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(404);
    expect(err.message).toBe("Route GET /nope not found");
  });
});
