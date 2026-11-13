import { z } from "zod";
import { MAX_DB_INT } from "@/core/schemas/id-param.schema";

/**
 * Body of `POST /api/bookings`. Dates are ISO 8601, `endTime` must be after `startTime` and `startTime` in the future.
 */
export const createBookingSchema = z
  .object({
    spaceId: z.number().int().positive().max(MAX_DB_INT),
    startTime: z.iso.datetime({ offset: true }).transform((value) => new Date(value)),
    endTime: z.iso.datetime({ offset: true }).transform((value) => new Date(value)),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: "endTime must be after startTime",
    path: ["endTime"],
  })
  .refine((data) => data.startTime > new Date(), {
    message: "startTime must be in the future",
    path: ["startTime"],
  });
