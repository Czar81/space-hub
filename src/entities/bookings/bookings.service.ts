import prisma from "@/lib/prisma";
import { BookingStatus, Prisma, UserRole } from "@prisma/client";
import { AppError } from "@/core/utils/app-error";
import { AuthUser } from "@/entities/auth/auth.types";
import { CreateBookingBody, LockedSpaceRow } from "@/entities/bookings/bookings.types";
import { AvailabilityAction, publishAvailabilityChange } from "@/core/events/pubsub";

const MS_PER_HOUR = 60 * 60 * 1000;

/**
 * Relations returned with every booking. The user is limited to public fields (never the password hash).
 */
const bookingInclude = {
  space: true,
  user: { select: { id: true, name: true, email: true, role: true } },
} satisfies Prisma.BookingInclude;

/** Admins can read and cancel any booking, members only their own. */
const isAdmin = (user: AuthUser) => user.role === UserRole.ADMIN;

/** Booking rules: no overlaps on a space, price calculation and ownership. */
export const bookingsService = {
  /**
   * Total price = duration in hours x price per hour, with two decimals.
   *
   * @param startTime Start of the booking.
   * @param endTime End of the booking.
   * @param pricePerHour Hourly price of the space.
   * @returns The amount as a fixed point string, e.g. `"67.50"`.
   */
  calculateTotalPrice(startTime: Date, endTime: Date, pricePerHour: number) {
    const hours = (endTime.getTime() - startTime.getTime()) / MS_PER_HOUR;
    return (hours * pricePerHour).toFixed(2);
  },

  /**
   * Creates a confirmed booking and publishes a `BOOKED` availability event once it is committed.
   * Publishing here (service layer) means REST and GraphQL bookings notify subscribers the same way.
   * The space row is locked inside a transaction, so concurrent requests for the same space are
   * serialized and only one of two overlapping bookings can succeed. Canceled bookings do not block the slot.
   *
   * @param user Authenticated user who books.
   * @param body Validated space id and time range.
   * @returns The booking with its space and user.
   * @throws AppError 404 when the space does not exist or is inactive.
   * @throws AppError 409 when the range overlaps an active booking.
   */
  async create(user: AuthUser, { spaceId, startTime, endTime }: CreateBookingBody) {
    const booking = await prisma.$transaction(async (tx) => {
      // Locking the space row serializes concurrent bookings for the same space
      const [lockedSpace] = await tx.$queryRaw<LockedSpaceRow[]>`
        SELECT "id" FROM "Space" WHERE "id" = ${spaceId} FOR UPDATE
      `;
      const space = lockedSpace ? await tx.space.findUnique({ where: { id: spaceId } }) : null;

      if (!space || !space.isActive) {
        throw AppError.notFound("Space not found or inactive");
      }

      const conflict = await tx.booking.findFirst({
        where: {
          spaceId,
          status: { not: BookingStatus.CANCELED },
          startTime: { lt: endTime },
          endTime: { gt: startTime },
        },
      });

      if (conflict) {
        throw AppError.conflict("The space is not available at that time");
      }

      return tx.booking.create({
        data: {
          userId: user.userId,
          spaceId,
          startTime,
          endTime,
          status: BookingStatus.CONFIRMED,
          totalPrice: this.calculateTotalPrice(startTime, endTime, space.pricePerHour),
        },
        include: bookingInclude,
      });
    });

    // Only after the commit: a rolled back booking must never reach the subscribers
    publishAvailabilityChange(AvailabilityAction.BOOKED, booking);
    return booking;
  },

  /**
   * Lists bookings ordered by start time.
   *
   * @param user Authenticated user.
   * @returns Every booking for admins, only the own ones for members.
   */
  async list(user: AuthUser) {
    return prisma.booking.findMany({
      where: isAdmin(user) ? {} : { userId: user.userId },
      include: bookingInclude,
      orderBy: { startTime: "asc" },
    });
  },

  /**
   * Returns a booking. A member asking for someone else's booking gets 404, same as for a missing one.
   *
   * @param user Authenticated user.
   * @param id Booking id.
   * @returns The booking with its space and user.
   * @throws AppError 404 when it does not exist or is not visible to the user.
   */
  async getById(user: AuthUser, id: number) {
    const booking = await prisma.booking.findUnique({ where: { id }, include: bookingInclude });

    if (!booking || (!isAdmin(user) && booking.userId !== user.userId)) {
      throw AppError.notFound("Booking not found");
    }

    return booking;
  },

  /**
   * Cancels a booking (owner or admin). The slot becomes available again and a `RELEASED` event is published.
   * The status change is a conditional update (`status != CANCELED`), so when two cancellations race
   * only one wins: the other gets 409 and no duplicate event is published.
   *
   * @param user Authenticated user.
   * @param id Booking id.
   * @returns The canceled booking.
   * @throws AppError 404 when it is not visible to the user.
   * @throws AppError 409 when it is already canceled.
   */
  async cancel(user: AuthUser, id: number) {
    const booking = await this.getById(user, id);

    if (booking.status === BookingStatus.CANCELED) {
      throw AppError.conflict("Booking is already canceled");
    }

    // Atomic check-and-set: a concurrent cancellation between getById and here updates 0 rows
    const { count } = await prisma.booking.updateMany({
      where: { id, status: { not: BookingStatus.CANCELED } },
      data: { status: BookingStatus.CANCELED },
    });

    if (count === 0) {
      throw AppError.conflict("Booking is already canceled");
    }

    const canceled = { ...booking, status: BookingStatus.CANCELED };
    publishAvailabilityChange(AvailabilityAction.RELEASED, canceled);
    return canceled;
  },
};
