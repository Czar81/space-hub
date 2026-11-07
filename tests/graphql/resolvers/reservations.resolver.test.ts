import { describe, it, expect, vi } from "vitest";
import { UserRole } from "@prisma/client";
import { reservationsResolvers } from "@/graphql/resolvers/reservations.resolver";
import { bookingsService } from "@/entities/bookings/bookings.service";

vi.mock("@/entities/bookings/bookings.service", () => ({
  bookingsService: { list: vi.fn(), getById: vi.fn(), create: vi.fn(), cancel: vi.fn() },
}));

const user = { userId: 1, email: "a@test.com", role: UserRole.MEMBER, type: "access" as const };
const ctx = { user };

describe("reservationsResolvers", () => {
  it("every operation requires authentication", async () => {
    const anon = { user: null };
    await expect(reservationsResolvers.bookings({}, anon)).rejects.toMatchObject({
      statusCode: 401,
    });
    await expect(reservationsResolvers.booking({ id: "1" }, anon)).rejects.toMatchObject({
      statusCode: 401,
    });
    await expect(reservationsResolvers.createBooking({}, anon)).rejects.toMatchObject({
      statusCode: 401,
    });
    await expect(reservationsResolvers.cancelBooking({ id: "1" }, anon)).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it("bookings passes the user to the service and formats dates", async () => {
    vi.mocked(bookingsService.list).mockResolvedValue([
      { id: 1, startTime: new Date("2030-01-01T00:00:00Z") },
    ] as never);
    expect(await reservationsResolvers.bookings({}, ctx)).toEqual([
      { id: 1, startTime: "2030-01-01T00:00:00.000Z" },
    ]);
    expect(bookingsService.list).toHaveBeenCalledWith(user);
  });

  it("booking / cancelBooking validate the id", async () => {
    await expect(reservationsResolvers.booking({ id: "x" }, ctx)).rejects.toMatchObject({
      statusCode: 400,
    });
    await expect(reservationsResolvers.cancelBooking({ id: "0" }, ctx)).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("booking / cancelBooking delegate with the parsed id", async () => {
    vi.mocked(bookingsService.getById).mockResolvedValue({ id: 3 } as never);
    vi.mocked(bookingsService.cancel).mockResolvedValue({ id: 3 } as never);
    await reservationsResolvers.booking({ id: "3" }, ctx);
    await reservationsResolvers.cancelBooking({ id: "3" }, ctx);
    expect(bookingsService.getById).toHaveBeenCalledWith(user, 3);
    expect(bookingsService.cancel).toHaveBeenCalledWith(user, 3);
  });

  it("createBooking validates the input (past start time -> 400)", async () => {
    await expect(
      reservationsResolvers.createBooking(
        { spaceId: 1, startTime: "2020-01-01T10:00:00Z", endTime: "2020-01-01T11:00:00Z" },
        ctx
      )
    ).rejects.toMatchObject({ statusCode: 400 });
    expect(bookingsService.create).not.toHaveBeenCalled();
  });

  it("createBooking delegates with parsed dates", async () => {
    vi.mocked(bookingsService.create).mockResolvedValue({ id: 1 } as never);
    const start = new Date(Date.now() + 3600_000).toISOString();
    const end = new Date(Date.now() + 7200_000).toISOString();
    await reservationsResolvers.createBooking({ spaceId: 1, startTime: start, endTime: end }, ctx);
    expect(bookingsService.create).toHaveBeenCalledWith(user, {
      spaceId: 1,
      startTime: new Date(start),
      endTime: new Date(end),
    });
  });
});
