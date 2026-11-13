import { vi } from "vitest";

// Env vars must exist before `env.config` is first imported
process.env.NODE_ENV = "test";
process.env.DB_USER = "test";
process.env.DB_PASSWORD = "test";
process.env.DB_NAME = "test";
process.env.JWT_SECRET = "test-secret-with-enough-length";
process.env.JWT_EXPIRES_IN = "15m";
process.env.JWT_REFRESH_EXPIRES_IN = "7d";

// Unit tests never touch the database: every model method is a mock
vi.mock("@/lib/prisma", async () => (await import("./prisma.mock")).prismaModule);

// Avoid pino transports and writing to tmp/app.log
vi.mock("@/core/utils/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));
