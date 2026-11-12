import { describe, it, expect } from "vitest";
import { prepareSubscription } from "@/graphql/subscriptions.server";

describe("prepareSubscription", () => {
  it("accepts a valid subscription", () => {
    const res = prepareSubscription(
      "subscription { spaceAvailabilityChanged(spaceId: 1) { action spaceId } }"
    );
    expect(res.errors).toBeUndefined();
    expect(res.document).toBeDefined();
  });

  it("rejects queries and mutations over WebSocket", () => {
    const res = prepareSubscription("{ spaces { id } }");
    expect(res.errors?.[0].message).toMatch(/Only subscriptions/);
  });

  it("returns syntax and validation errors", () => {
    expect(prepareSubscription("subscription {").errors).toHaveLength(1);
    expect(prepareSubscription("subscription { nope }").errors?.length).toBeGreaterThan(0);
  });
});
