import { z } from "zod";
import { SpaceType } from "@prisma/client";
import { MAX_DB_INT } from "@/core/schemas/id-param.schema";

/** Body of `POST /api/spaces`. */
export const createSpaceSchema = z.object({
  name: z.string().trim().min(1).max(120),
  type: z.enum(SpaceType),
  capacity: z.number().int().positive().max(MAX_DB_INT),
  pricePerHour: z.number().int().positive().max(MAX_DB_INT),
  location: z.string().trim().min(1).max(160),
  isActive: z.boolean().optional(),
});

/** Body of `PUT /api/spaces/:id`: any subset of the space fields, at least one. */
export const updateSpaceSchema = createSpaceSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

/**
 * Query string of `GET /api/spaces` (also the arguments of the GraphQL `spaces` query).
 * - `type`, `minCapacity`: catalog filters.
 * - `date` (YYYY-MM-DD): spaces free during the whole UTC day.
 * - `startTime` + `endTime` (ISO 8601, sent together): spaces free during that exact range,
 *   which is what a client needs to book a few hours of a day that already has other bookings.
 */
export const listSpacesQuerySchema = z
  .object({
    type: z.enum(SpaceType).optional(),
    minCapacity: z.coerce.number().int().positive().max(MAX_DB_INT).optional(),
    date: z.iso.date().optional(),
    startTime: z.iso
      .datetime({ offset: true })
      .transform((value) => new Date(value))
      .optional(),
    endTime: z.iso
      .datetime({ offset: true })
      .transform((value) => new Date(value))
      .optional(),
  })
  .refine((data) => (data.startTime === undefined) === (data.endTime === undefined), {
    message: "startTime and endTime must be sent together",
    path: ["endTime"],
  })
  .refine((data) => !data.startTime || !data.endTime || data.endTime > data.startTime, {
    message: "endTime must be after startTime",
    path: ["endTime"],
  });
