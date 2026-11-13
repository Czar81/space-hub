import { IncomingMessage } from "http";

/** Limits of the WebSocket connection limiter. */
export interface ConnectionLimits {
  /** Open connections allowed per client IP. */
  perIp: number;
  /** Open connections allowed in total. */
  total: number;
}

/**
 * Client IP of an upgrade request, using the same rule as Express with `trust proxy = 1`:
 * the last `X-Forwarded-For` entry (added by our proxy) or the socket address without a proxy.
 *
 * @param req HTTP upgrade request.
 * @returns The client IP, `"unknown"` when it cannot be read.
 */
export const getClientIp = (req: IncomingMessage) => {
  const forwarded = req.headers["x-forwarded-for"];
  const header = Array.isArray(forwarded) ? forwarded.join(",") : forwarded;
  const lastHop = header?.split(",").pop()?.trim();
  return lastHop || req.socket.remoteAddress || "unknown";
};

/**
 * Counts open WebSocket connections per IP and in total.
 * The HTTP rate limiter does not apply to the upgrade, so without this anyone could open
 * thousands of sockets on the public subscription endpoint.
 *
 * @param limits Maximum connections per IP and in total.
 * @returns `tryAcquire` reserves a slot (false when a limit is reached) and `release` frees it.
 */
export const createConnectionLimiter = (limits: ConnectionLimits) => {
  const perIp = new Map<string, number>();
  let total = 0;

  return {
    tryAcquire(ip: string) {
      const current = perIp.get(ip) ?? 0;
      if (current >= limits.perIp || total >= limits.total) return false;

      perIp.set(ip, current + 1);
      total += 1;
      return true;
    },

    release(ip: string) {
      const current = perIp.get(ip) ?? 0;
      if (current === 0) return;

      if (current === 1) perIp.delete(ip);
      else perIp.set(ip, current - 1);
      total -= 1;
    },

    /** Open connections, for tests and diagnostics. */
    stats: () => ({ total, ips: perIp.size }),
  };
};
