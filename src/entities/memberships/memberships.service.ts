import prisma from "@/lib/prisma";
import { AppError } from "@/core/utils/app-error";
import { UpdateMembershipBody } from "@/entities/memberships/memberships.types";

/** Owner of the membership, limited to public fields. */
const membershipInclude = {
  user: { select: { id: true, name: true, email: true, role: true } },
};

/** Membership plans. Each user has exactly one membership, created at registration. */
export const membershipsService = {
  /**
   * Lists memberships that have not expired yet.
   *
   * @returns Memberships with their owner, ordered by id.
   */
  async listActive() {
    return prisma.membership.findMany({
      where: { endDate: { gte: new Date() } },
      include: membershipInclude,
      orderBy: { id: "asc" },
    });
  },

  /**
   * Changes the plan of a user.
   *
   * @param userId Id of the membership owner.
   * @param body Validated body with the new plan.
   * @returns The updated membership.
   * @throws AppError 404 when the user has no membership.
   */
  async updatePlan(userId: number, { plan }: UpdateMembershipBody) {
    const membership = await prisma.membership.findUnique({ where: { userId } });

    if (!membership) {
      throw AppError.notFound("Membership not found for this user");
    }

    return prisma.membership.update({
      where: { userId },
      data: { plan },
      include: membershipInclude,
    });
  },
};
