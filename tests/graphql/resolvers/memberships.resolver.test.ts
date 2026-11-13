import { describe, it, expect, vi } from "vitest";
import { UserRole } from "@prisma/client";
import { membershipsResolvers } from "@/graphql/resolvers/memberships.resolver";
import { membershipsService } from "@/entities/memberships/memberships.service";

vi.mock("@/entities/memberships/memberships.service", () => ({
  membershipsService: { listActive: vi.fn(), updatePlan: vi.fn() },
}));

const ctx = (role: UserRole) => ({
  user: { userId: 1, email: "a@test.com", role, type: "access" as const },
});

describe("membershipsResolvers", () => {
  it("memberships is admin only", async () => {
    await expect(membershipsResolvers.memberships({}, ctx(UserRole.MEMBER))).rejects.toMatchObject({
      statusCode: 403,
    });
    await expect(membershipsResolvers.memberships({}, { user: null })).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it("memberships formats dates for an admin", async () => {
    vi.mocked(membershipsService.listActive).mockResolvedValue([
      { id: 1, endDate: new Date("2030-01-01T00:00:00Z") },
    ] as never);
    expect(await membershipsResolvers.memberships({}, ctx(UserRole.ADMIN))).toEqual([
      { id: 1, endDate: "2030-01-01T00:00:00.000Z" },
    ]);
  });

  it("updateMembership validates plan and id", async () => {
    const admin = ctx(UserRole.ADMIN);
    await expect(
      membershipsResolvers.updateMembership({ userId: "1", plan: "GOLD" }, admin)
    ).rejects.toMatchObject({ statusCode: 400 });
    await expect(
      membershipsResolvers.updateMembership({ userId: "abc", plan: "PRO" }, admin)
    ).rejects.toMatchObject({ statusCode: 400 });
    expect(membershipsService.updatePlan).not.toHaveBeenCalled();
  });

  it("updateMembership delegates with parsed values", async () => {
    vi.mocked(membershipsService.updatePlan).mockResolvedValue({ id: 1 } as never);
    await membershipsResolvers.updateMembership({ userId: "7", plan: "PRO" }, ctx(UserRole.ADMIN));
    expect(membershipsService.updatePlan).toHaveBeenCalledWith(7, { plan: "PRO" });
  });
});
