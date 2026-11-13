import { describe, it, expect, vi } from "vitest";
import { MembershipPlan } from "@prisma/client";
import prisma from "@/lib/prisma";
import { membershipsService } from "@/entities/memberships/memberships.service";

const db = vi.mocked(prisma, true);

describe("membershipsService", () => {
  it("listActive only asks for memberships not expired yet", async () => {
    db.membership.findMany.mockResolvedValue([]);
    await membershipsService.listActive();
    const { where, orderBy } = db.membership.findMany.mock.calls[0][0];
    expect(where.endDate.gte).toBeInstanceOf(Date);
    expect(orderBy).toEqual({ id: "asc" });
  });

  describe("updatePlan", () => {
    it("404 when the user has no membership", async () => {
      db.membership.findUnique.mockResolvedValue(null);
      await expect(
        membershipsService.updatePlan(1, { plan: MembershipPlan.PRO })
      ).rejects.toMatchObject({ statusCode: 404 });
      expect(db.membership.update).not.toHaveBeenCalled();
    });

    it("updates the plan", async () => {
      db.membership.findUnique.mockResolvedValue({ id: 1 } as never);
      db.membership.update.mockResolvedValue({ id: 1, plan: MembershipPlan.PRO } as never);
      await membershipsService.updatePlan(7, { plan: MembershipPlan.PRO });
      expect(db.membership.update.mock.calls[0][0]).toMatchObject({
        where: { userId: 7 },
        data: { plan: MembershipPlan.PRO },
      });
    });
  });
});
