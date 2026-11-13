import { z } from "zod";
import { createBookingSchema } from "@/entities/bookings/bookings.schema";

export type CreateBookingBody = z.infer<typeof createBookingSchema>;

/** Row returned by the `SELECT ... FOR UPDATE` that locks a space while booking. */
export interface LockedSpaceRow {
  /** Id of the locked space. */
  id: number;
}
