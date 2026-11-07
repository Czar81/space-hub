import { describe, it, expect, vi } from "vitest";
import { asyncHandler } from "@/core/utils/async-handler";

describe("asyncHandler", () => {
  it("forwards rejected promises to next", async () => {
    const error = new Error("boom");
    const next = vi.fn();
    asyncHandler(async () => {
      throw error;
    })({} as never, {} as never, next);
    await new Promise((r) => setImmediate(r));
    expect(next).toHaveBeenCalledWith(error);
  });

  it("does not call next when the handler succeeds", async () => {
    const next = vi.fn();
    asyncHandler(async () => "ok")({} as never, {} as never, next);
    await new Promise((r) => setImmediate(r));
    expect(next).not.toHaveBeenCalled();
  });
});
