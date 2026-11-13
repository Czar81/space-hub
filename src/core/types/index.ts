import type { z } from "zod";
import type { idParamSchema } from "@/core/schemas/id-param.schema";

/**
 * Supported runtime environments (`NODE_ENV`, case insensitive).
 * `Test` disables rate limiting so the Bruno suite is not throttled.
 */
export enum Environments {
  Development = "development",
  Production = "production",
  Test = "test",
}

/** Part of the Express request that the `validate` middleware can check. */
export type RequestSource = "body" | "query" | "params";

/** Parsed `:id` route parameter. */
export type IdParams = z.infer<typeof idParamSchema>;
