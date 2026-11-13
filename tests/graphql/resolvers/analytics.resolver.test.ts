import { describe, it, expect, vi } from "vitest";
import { UserRole } from "@prisma/client";
import { analyticsResolvers } from "@/graphql/resolvers/analytics.resolver";
import { analyticsService } from "@/entities/analytics/analytics.service";

vi.mock("@/entities/analytics/analytics.service", () => ({
  analyticsService: { dashboard: vi.fn() },
}));

const ctx = (role: UserRole) => ({
  user: { userId: 1, email: "a@test.com", role, type: "access" as const },
});

describe("analyticsResolvers.occupancyAnalytics", () => {
  it("is admin only", async () => {
    await expect(
      analyticsResolvers.occupancyAnalytics({}, ctx(UserRole.MEMBER))
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(analyticsService.dashboard).not.toHaveBeenCalled();
  });

  it("passes the validated period to the service", async () => {
    vi.mocked(analyticsService.dashboard).mockResolvedValue({ totalSpaces: 1 } as never);
    await analyticsResolvers.occupancyAnalytics(
      { from: "2030-01-01", to: "2030-02-01", groupBy: "WEEK" },
      ctx(UserRole.ADMIN)
    );
    expect(analyticsService.dashboard).toHaveBeenCalledWith({
      from: new Date("2030-01-01T00:00:00Z"),
      to: new Date("2030-02-01T00:00:00Z"),
      groupBy: "WEEK",
    });
  });

  it("400 for an invalid period", async () => {
    await expect(
      analyticsResolvers.occupancyAnalytics(
        { from: "2030-02-01", to: "2030-01-01" },
        ctx(UserRole.ADMIN)
      )
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});
