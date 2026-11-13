import { withFilter } from "graphql-subscriptions";
import { pubsub, SPACE_AVAILABILITY_CHANGED, SpaceAvailabilityEvent } from "@/core/events/pubsub";
import { GraphQLContext, SpaceAvailabilityArgs } from "@/graphql/graphql.types";
import { parseId } from "@/graphql/guards";

/** Payload published on `SPACE_AVAILABILITY_CHANGED`, keyed by the subscription field. */
interface AvailabilityPayload {
  spaceAvailabilityChanged: SpaceAvailabilityEvent;
}

/**
 * Subscription `spaceAvailabilityChanged` (public, WebSocket only).
 * Emits every time a booking is created or canceled, through REST or GraphQL,
 * because the events are published by `bookingsService`. Optional `spaceId` narrows it to one space.
 */
export const availabilitySubscriptions = {
  spaceAvailabilityChanged: (
    args: SpaceAvailabilityArgs,
    context: GraphQLContext,
    info: unknown
  ): AsyncIterator<AvailabilityPayload> => {
    const spaceId = args.spaceId != null ? parseId(args.spaceId, "spaceId") : null;

    return withFilter(
      () => pubsub.asyncIterator(SPACE_AVAILABILITY_CHANGED),
      (payload: AvailabilityPayload) =>
        spaceId === null || payload.spaceAvailabilityChanged.spaceId === spaceId
    )(undefined, args, context, info);
  },
};
