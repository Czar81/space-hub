import { describe, it, expect } from "vitest";
import { BookingStatus } from "@prisma/client";
import {
  AvailabilityAction,
  publishAvailabilityChange,
  pubsub,
  SPACE_AVAILABILITY_CHANGED,
} from "@/core/events/pubsub";
import { availabilitySubscriptions } from "@/graphql/resolvers/availability.resolver";

const booking = (spaceId: number, id = 1) => ({
  id,
  spaceId,
  startTime: new Date("2030-01-01T10:00:00Z"),
  endTime: new Date("2030-01-01T12:00:00Z"),
  status: BookingStatus.CONFIRMED,
});

describe("availability events", () => {
  it("publishes the event keyed by the subscription field, without user data", async () => {
    const iterator = pubsub.asyncIterator(SPACE_AVAILABILITY_CHANGED);
    const next = iterator.next();
    publishAvailabilityChange(AvailabilityAction.BOOKED, { ...booking(7), userId: 3 } as never);

    const { value } = await next;
    expect(value.spaceAvailabilityChanged).toMatchObject({
      action: "BOOKED",
      bookingId: 1,
      spaceId: 7,
      startTime: "2030-01-01T10:00:00.000Z",
      endTime: "2030-01-01T12:00:00.000Z",
    });
    expect(value.spaceAvailabilityChanged).not.toHaveProperty("userId");
    await iterator.return?.();
  });

  it("the subscription filters by spaceId", async () => {
    const iterator = availabilitySubscriptions.spaceAvailabilityChanged(
      { spaceId: "2" },
      { user: null },
      {}
    );
    const next = iterator.next();
    // Let the filtered iterator subscribe before publishing
    await new Promise((resolve) => setTimeout(resolve, 0));

    publishAvailabilityChange(AvailabilityAction.BOOKED, booking(1, 10));
    publishAvailabilityChange(AvailabilityAction.RELEASED, booking(2, 11));

    const { value } = await next;
    expect(value.spaceAvailabilityChanged).toMatchObject({ action: "RELEASED", bookingId: 11 });
    await iterator.return?.();
  });

  it("rejects an invalid spaceId", () => {
    expect(() =>
      availabilitySubscriptions.spaceAvailabilityChanged({ spaceId: "abc" }, { user: null }, {})
    ).toThrowError(expect.objectContaining({ statusCode: 400 }));
  });
});
