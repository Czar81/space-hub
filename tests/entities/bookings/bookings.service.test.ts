import { describe, it, expect, vi } from "vitest";
import { BookingStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { bookingsService } from "@/entities/bookings/bookings.service";
import { admin, makeBooking, makeSpace, member } from "../../helpers/factories";
import { AvailabilityAction, publishAvailabilityChange } from "@/core/events/pubsub";

vi.mock("@/core/events/pubsub", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/core/events/pubsub")>()),
  publishAvailabilityChange: vi.fn(),
}));

const db = vi.mocked(prisma, true);
const range = {
  spaceId: 1,
  startTime: new Date("2030-01-01T10:00:00Z"),
  endTime: new Date("2030-01-01T11:30:00Z"),
};

describe("bookingsService", () => {
  describe("calculateTotalPrice", () => {
    it("hours x price with two decimals", () => {
      expect(bookingsService.calculateTotalPrice(range.startTime, range.endTime, 45)).toBe("67.50");
    });

    it("handles partial hours", () => {
      const end = new Date("2030-01-01T10:20:00Z");
      expect(bookingsService.calculateTotalPrice(range.startTime, end, 10)).toBe("3.33");
    });
  });

  describe("create", () => {
    it("404 when the space row does not exist", async () => {
      db.$queryRaw.mockResolvedValue([]);
      await expect(bookingsService.create(member, range)).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it("404 when the space is inactive", async () => {
      db.$queryRaw.mockResolvedValue([{ id: 1 }]);
      db.space.findUnique.mockResolvedValue(makeSpace({ isActive: false }));
      await expect(bookingsService.create(member, range)).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it("409 when the range overlaps an active booking", async () => {
      db.$queryRaw.mockResolvedValue([{ id: 1 }]);
      db.space.findUnique.mockResolvedValue(makeSpace());
      db.booking.findFirst.mockResolvedValue(makeBooking());
      await expect(bookingsService.create(member, range)).rejects.toMatchObject({
        statusCode: 409,
      });
      expect(db.booking.create).not.toHaveBeenCalled();
    });

    it("ignores canceled bookings and overlap is checked with strict bounds", async () => {
      db.$queryRaw.mockResolvedValue([{ id: 1 }]);
      db.space.findUnique.mockResolvedValue(makeSpace());
      db.booking.findFirst.mockResolvedValue(null);
      db.booking.create.mockResolvedValue(makeBooking());

      await bookingsService.create(member, range);

      expect(db.booking.findFirst).toHaveBeenCalledWith({
        where: {
          spaceId: 1,
          status: { not: BookingStatus.CANCELED },
          startTime: { lt: range.endTime },
          endTime: { gt: range.startTime },
        },
      });
    });

    it("creates a CONFIRMED booking for the user with the calculated price", async () => {
      db.$queryRaw.mockResolvedValue([{ id: 1 }]);
      db.space.findUnique.mockResolvedValue(makeSpace({ pricePerHour: 45 }));
      db.booking.findFirst.mockResolvedValue(null);
      db.booking.create.mockResolvedValue(makeBooking());

      await bookingsService.create(member, range);

      expect(db.booking.create.mock.calls[0][0].data).toMatchObject({
        userId: member.userId,
        spaceId: 1,
        status: BookingStatus.CONFIRMED,
        totalPrice: "67.50",
      });
    });

    it("publishes a BOOKED event after the transaction, never on failure", async () => {
      db.$queryRaw.mockResolvedValue([{ id: 1 }]);
      db.space.findUnique.mockResolvedValue(makeSpace());
      db.booking.findFirst.mockResolvedValue(makeBooking());
      await bookingsService.create(member, range).catch(() => {});
      expect(publishAvailabilityChange).not.toHaveBeenCalled();

      const booking = makeBooking();
      db.booking.findFirst.mockResolvedValue(null);
      db.booking.create.mockResolvedValue(booking);
      await bookingsService.create(member, range);
      expect(publishAvailabilityChange).toHaveBeenCalledWith(AvailabilityAction.BOOKED, booking);
    });
  });

  describe("list", () => {
    it("members only see their own bookings", async () => {
      db.booking.findMany.mockResolvedValue([]);
      await bookingsService.list(member);
      expect(db.booking.findMany.mock.calls[0][0].where).toEqual({ userId: member.userId });
    });

    it("admins see every booking", async () => {
      db.booking.findMany.mockResolvedValue([]);
      await bookingsService.list(admin);
      expect(db.booking.findMany.mock.calls[0][0].where).toEqual({});
    });
  });

  describe("getById", () => {
    it("404 when missing", async () => {
      db.booking.findUnique.mockResolvedValue(null);
      await expect(bookingsService.getById(member, 1)).rejects.toMatchObject({ statusCode: 404 });
    });

    it("404 (not 403) for someone else's booking", async () => {
      db.booking.findUnique.mockResolvedValue(makeBooking({ userId: 2 }));
      await expect(bookingsService.getById(member, 1)).rejects.toMatchObject({ statusCode: 404 });
    });

    it("owner and admin can read it", async () => {
      db.booking.findUnique.mockResolvedValue(makeBooking({ userId: member.userId }));
      await expect(bookingsService.getById(member, 1)).resolves.toBeTruthy();
      db.booking.findUnique.mockResolvedValue(makeBooking({ userId: 2 }));
      await expect(bookingsService.getById(admin, 1)).resolves.toBeTruthy();
    });
  });

  describe("cancel", () => {
    it("409 when already canceled", async () => {
      db.booking.findUnique.mockResolvedValue(makeBooking({ status: BookingStatus.CANCELED }));
      await expect(bookingsService.cancel(member, 1)).rejects.toMatchObject({ statusCode: 409 });
      expect(db.booking.updateMany).not.toHaveBeenCalled();
    });

    it("sets status CANCELED only if it is not canceled yet (atomic)", async () => {
      db.booking.findUnique.mockResolvedValue(makeBooking());
      db.booking.updateMany.mockResolvedValue({ count: 1 });
      const res = await bookingsService.cancel(member, 1);
      expect(db.booking.updateMany).toHaveBeenCalledWith({
        where: { id: 1, status: { not: BookingStatus.CANCELED } },
        data: { status: BookingStatus.CANCELED },
      });
      expect(res.status).toBe(BookingStatus.CANCELED);
    });

    it("publishes a RELEASED event", async () => {
      db.booking.findUnique.mockResolvedValue(makeBooking());
      db.booking.updateMany.mockResolvedValue({ count: 1 });
      const canceled = await bookingsService.cancel(member, 1);
      expect(publishAvailabilityChange).toHaveBeenCalledWith(AvailabilityAction.RELEASED, canceled);
    });

    it("a cancellation that loses the race gets 409 and publishes nothing", async () => {
      db.booking.findUnique.mockResolvedValue(makeBooking());
      db.booking.updateMany.mockResolvedValue({ count: 0 });
      await expect(bookingsService.cancel(member, 1)).rejects.toMatchObject({ statusCode: 409 });
      expect(publishAvailabilityChange).not.toHaveBeenCalled();
    });
  });
});
