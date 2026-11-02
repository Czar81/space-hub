import { z } from "zod";
import {
  createSpaceSchema,
  updateSpaceSchema,
  listSpacesQuerySchema,
} from "@/entities/spaces/spaces.schema";

export type CreateSpaceBody = z.infer<typeof createSpaceSchema>;
export type UpdateSpaceBody = z.infer<typeof updateSpaceSchema>;
export type ListSpacesQuery = z.infer<typeof listSpacesQuerySchema>;
