import prisma from "@/lib/prisma";
import { BookingStatus, Prisma } from "@prisma/client";
import { AppError } from "@/core/utils/app-error";
import { CreateSpaceBody, ListSpacesQuery, UpdateSpaceBody } from "@/entities/spaces/spaces.types";

/** Catalog of coworking spaces. Deactivation is a soft delete that keeps the booking history. */
export const spacesService = {
  /**
   * Lists active spaces filtered by type and minimum capacity.
   * With `date`, spaces having an active booking that overlaps that (UTC) day are left out.
   *
   * @param query Validated query string filters.
   * @returns Active spaces ordered by id.
   */
  async list({ type, minCapacity, date }: ListSpacesQuery) {
    const where: Prisma.SpaceWhereInput = { isActive: true };

    if (type) where.type = type;
    if (minCapacity) where.capacity = { gte: minCapacity };

    if (date) {
      const dayStart = new Date(`${date}T00:00:00.000Z`);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

      where.bookings = {
        none: {
          status: { not: BookingStatus.CANCELED },
          startTime: { lt: dayEnd },
          endTime: { gt: dayStart },
        },
      };
    }

    return prisma.space.findMany({ where, orderBy: { id: "asc" } });
  },

  /**
   * Public lookup: inactive spaces answer 404 as if they did not exist.
   *
   * @param id Space id.
   * @returns The active space.
   * @throws AppError 404 when it does not exist or is inactive.
   */
  async getActiveById(id: number) {
    const space = await prisma.space.findUnique({ where: { id } });

    if (!space || !space.isActive) {
      throw AppError.notFound("Space not found");
    }

    return space;
  },

  /**
   * Creates a space (admin).
   *
   * @param data Validated space body.
   * @returns The created space.
   */
  async create(data: CreateSpaceBody) {
    return prisma.space.create({ data });
  },

  /**
   * Updates the given fields of a space, active or not (admin).
   *
   * @param id Space id.
   * @param data Fields to change.
   * @returns The updated space.
   * @throws AppError 404 when the space does not exist.
   */
  async update(id: number, data: UpdateSpaceBody) {
    await this.getById(id);
    return prisma.space.update({ where: { id }, data });
  },

  /**
   * Soft delete: sets `isActive` to false. The space and its bookings are kept (admin).
   *
   * @param id Space id.
   * @returns The deactivated space.
   * @throws AppError 404 when the space does not exist.
   */
  async deactivate(id: number) {
    await this.getById(id);
    return prisma.space.update({ where: { id }, data: { isActive: false } });
  },

  /**
   * Internal lookup that also finds inactive spaces.
   *
   * @param id Space id.
   * @returns The space.
   * @throws AppError 404 when it does not exist.
   */
  async getById(id: number) {
    const space = await prisma.space.findUnique({ where: { id } });

    if (!space) {
      throw AppError.notFound("Space not found");
    }

    return space;
  },
};
