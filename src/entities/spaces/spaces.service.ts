import prisma from "@/lib/prisma";
import { BookingStatus, Prisma } from "@prisma/client";
import { AppError } from "@/core/utils/app-error";
import {
  CreateSpaceBody,
  ListSpacesQuery,
  SpaceReadOptions,
  UpdateSpaceBody,
} from "@/entities/spaces/spaces.types";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Bookings of the space with their user (public fields only), only for admins. */
const bookingsInclude = {
  bookings: {
    include: { user: { select: { id: true, name: true, email: true, role: true } } },
    orderBy: { startTime: "asc" },
  },
} satisfies Prisma.SpaceInclude;

/** Space with no active (non canceled) booking overlapping `[start, end)`. */
const freeDuring = (start: Date, end: Date): Prisma.SpaceWhereInput => ({
  bookings: {
    none: {
      status: { not: BookingStatus.CANCELED },
      startTime: { lt: end },
      endTime: { gt: start },
    },
  },
});

/** Catalog of coworking spaces. Deactivation is a soft delete that keeps the booking history. */
export const spacesService = {
  /**
   * Lists active spaces filtered by type and minimum capacity. Shared by REST and GraphQL.
   * - `date`: only spaces with no active booking at any time of that UTC day (free all day).
   * - `startTime`/`endTime`: only spaces with no active booking overlapping that range,
   *   so a space booked 09:00-10:00 still appears for 14:00-16:00 of the same day.
   *
   * @param query Validated filters.
   * @param options `includeBookings` adds every booking with its user (admins only).
   * @returns Active spaces ordered by id.
   */
  async list(
    { type, minCapacity, date, startTime, endTime }: ListSpacesQuery,
    { includeBookings = false }: SpaceReadOptions = {}
  ) {
    const where: Prisma.SpaceWhereInput = { isActive: true };
    const availability: Prisma.SpaceWhereInput[] = [];

    if (type) where.type = type;
    if (minCapacity) where.capacity = { gte: minCapacity };

    if (date) {
      const dayStart = new Date(`${date}T00:00:00.000Z`);
      availability.push(freeDuring(dayStart, new Date(dayStart.getTime() + MS_PER_DAY)));
    }

    if (startTime && endTime) availability.push(freeDuring(startTime, endTime));

    if (availability.length > 0) where.AND = availability;

    return prisma.space.findMany({
      where,
      orderBy: { id: "asc" },
      ...(includeBookings && { include: bookingsInclude }),
    });
  },

  /**
   * Public lookup: inactive spaces answer 404 as if they did not exist.
   *
   * @param id Space id.
   * @param options `includeBookings` adds every booking with its user (admins only).
   * @returns The active space.
   * @throws AppError 404 when it does not exist or is inactive.
   */
  async getActiveById(id: number, { includeBookings = false }: SpaceReadOptions = {}) {
    const space = await prisma.space.findUnique({
      where: { id },
      ...(includeBookings && { include: bookingsInclude }),
    });

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
