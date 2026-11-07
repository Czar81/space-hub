import { describe, it, expect, vi } from "vitest";
import { z, ZodError } from "zod";
import { validate } from "@/core/middlewares/validate";

const schema = z.object({ n: z.coerce.number() });

describe("validate", () => {
  it("replaces the source with the parsed data", () => {
    const req = { body: { n: "5" } };
    const next = vi.fn();
    validate(schema)(req as never, {} as never, next);
    expect(req.body).toEqual({ n: 5 });
    expect(next).toHaveBeenCalledWith();
  });

  it("validates the chosen source", () => {
    const req = { query: { n: "7" } };
    validate(schema, "query")(req as never, {} as never, vi.fn());
    expect(req.query).toEqual({ n: 7 });
  });

  it("forwards the ZodError on failure and leaves the request untouched", () => {
    const req = { body: { n: "abc" } };
    const next = vi.fn();
    validate(schema)(req as never, {} as never, next);
    expect(next.mock.calls[0][0]).toBeInstanceOf(ZodError);
    expect(req.body).toEqual({ n: "abc" });
  });
});
