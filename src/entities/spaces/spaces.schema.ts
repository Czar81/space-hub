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

/** Query string of `GET /api/spaces`: `type`, `minCapacity` and `date` (YYYY-MM-DD). */
export const listSpacesQuerySchema = z.object({
  type: z.enum(SpaceType).optional(),
  minCapacity: z.coerce.number().int().positive().max(MAX_DB_INT).optional(),
  date: z.iso.date().optional(),
});
