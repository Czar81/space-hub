import { describe, it, expect } from "vitest";
import { IncomingMessage } from "http";
import { createConnectionLimiter, getClientIp } from "@/graphql/connection-limiter";

const req = (headers: Record<string, string | string[]>, remoteAddress = "10.0.0.1") =>
  ({ headers, socket: { remoteAddress } }) as unknown as IncomingMessage;

describe("createConnectionLimiter", () => {
  it("caps connections per IP and frees the slot on release", () => {
    const limiter = createConnectionLimiter({ perIp: 2, total: 10 });
    expect(limiter.tryAcquire("a")).toBe(true);
    expect(limiter.tryAcquire("a")).toBe(true);
    expect(limiter.tryAcquire("a")).toBe(false);
    expect(limiter.tryAcquire("b")).toBe(true);

    limiter.release("a");
    expect(limiter.tryAcquire("a")).toBe(true);
  });

  it("caps the total across IPs", () => {
    const limiter = createConnectionLimiter({ perIp: 5, total: 2 });
    expect(limiter.tryAcquire("a")).toBe(true);
    expect(limiter.tryAcquire("b")).toBe(true);
    expect(limiter.tryAcquire("c")).toBe(false);
  });

  it("ignores releases without a slot and cleans up empty IPs", () => {
    const limiter = createConnectionLimiter({ perIp: 1, total: 1 });
    limiter.release("ghost");
    expect(limiter.stats()).toEqual({ total: 0, ips: 0 });
    limiter.tryAcquire("a");
    limiter.release("a");
    expect(limiter.stats()).toEqual({ total: 0, ips: 0 });
  });
});

describe("getClientIp", () => {
  it("uses the last X-Forwarded-For hop (trust proxy = 1) or the socket address", () => {
    expect(getClientIp(req({ "x-forwarded-for": "1.1.1.1, 2.2.2.2" }))).toBe("2.2.2.2");
    expect(getClientIp(req({}))).toBe("10.0.0.1");
  });
});
