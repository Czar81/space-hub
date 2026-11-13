import { z } from "zod";

/** Largest value of a PostgreSQL `INTEGER`. Ids above it would make Prisma fail with a 500. */
export const MAX_DB_INT = 2147483647;

/** Validates a positive integer `:id` route parameter. */
export const idParamSchema = z.object({
  id: z.coerce.number().int().positive().max(MAX_DB_INT),
});
