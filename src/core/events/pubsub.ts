import { EventEmitter } from "events";
import { PubSub } from "graphql-subscriptions";
import { BookingStatus } from "@prisma/client";

/** Topic published every time a booking changes the availability of a space. */
export const SPACE_AVAILABILITY_CHANGED = "SPACE_AVAILABILITY_CHANGED";

/** What happened to the booking that changed the availability. */
export enum AvailabilityAction {
  /** A new booking now occupies the range. */
  BOOKED = "BOOKED",
  /** A booking was canceled and the range is free again. */
  RELEASED = "RELEASED",
}

/**
 * Event sent to the `spaceAvailabilityChanged` subscribers.
 * It never carries user data, the subscription is public.
 */
export interface SpaceAvailabilityEvent {
  action: AvailabilityAction;
  bookingId: number;
  spaceId: number;
  startTime: string;
  endTime: string;
  occurredAt: string;
}

/**
 * Every subscriber adds a listener on the same topic. The default limit (10) would print a
 * `MaxListenersExceededWarning` with the 11th subscriber, which looks like a leak but is expected here.
 * Connections are capped by the WebSocket server instead.
 */
const eventEmitter = new EventEmitter();
eventEmitter.setMaxListeners(0);

/**
 * In-memory event bus shared by the services (publishers) and the GraphQL subscriptions (subscribers).
 * It works inside a single process; running several instances needs a shared engine (e.g. Redis PubSub).
 */
export const pubsub = new PubSub({ eventEmitter });

/** Minimal booking shape needed to build an availability event. */
interface BookingLike {
  id: number;
  spaceId: number;
  startTime: Date;
  endTime: Date;
  status: BookingStatus;
}

/**
 * Publishes an availability change for the space of the booking.
 * Publishing never breaks the operation that triggered it: errors are swallowed.
 *
 * @param action Whether the range was booked or released.
 * @param booking Booking that was created or canceled.
 */
export const publishAvailabilityChange = (action: AvailabilityAction, booking: BookingLike) => {
  const event: SpaceAvailabilityEvent = {
    action,
    bookingId: booking.id,
    spaceId: booking.spaceId,
    startTime: booking.startTime.toISOString(),
    endTime: booking.endTime.toISOString(),
    occurredAt: new Date().toISOString(),
  };

  // The payload is keyed by the subscription field so the default GraphQL resolver finds it
  pubsub.publish(SPACE_AVAILABILITY_CHANGED, { spaceAvailabilityChanged: event }).catch(() => {});
};
