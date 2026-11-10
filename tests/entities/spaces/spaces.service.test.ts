import { describe, it, expect, vi } from "vitest";
import { BookingStatus, SpaceType } from "@prisma/client";
import prisma from "@/lib/prisma";
import { spacesService } from "@/entities/spaces/spaces.service";
import { makeSpace } from "../../helpers/factories";

const db = vi.mocked(prisma, true);
const where = () => db.space.findMany.mock.calls[0][0].where;

describe("spacesService", () => {
  describe("list", () => {
    it("defaults to active spaces ordered by id", async () => {
      db.space.findMany.mockResolvedValue([]);
      await spacesService.list({});
      expect(where()).toEqual({ isActive: true });
      expect(db.space.findMany.mock.calls[0][0].orderBy).toEqual({ id: "asc" });
    });

    it("filters by type and minimum capacity", async () => {
      db.space.findMany.mockResolvedValue([]);
      await spacesService.list({ type: SpaceType.INDIVIDUAL_DESK, minCapacity: 4 });
      expect(where()).toMatchObject({ type: SpaceType.INDIVIDUAL_DESK, capacity: { gte: 4 } });
    });

    it("date keeps only spaces free during the whole UTC day", async () => {
      db.space.findMany.mockResolvedValue([]);
      await spacesService.list({ date: "2030-01-01" });
      expect(where().AND).toEqual([
        {
          bookings: {
            none: {
              status: { not: BookingStatus.CANCELED },
              startTime: { lt: new Date("2030-01-02T00:00:00.000Z") },
              endTime: { gt: new Date("2030-01-01T00:00:00.000Z") },
            },
          },
        },
      ]);
    });

    it("startTime/endTime keep spaces free during that exact range only", async () => {
      db.space.findMany.mockResolvedValue([]);
      const startTime = new Date("2030-01-01T14:00:00Z");
      const endTime = new Date("2030-01-01T16:00:00Z");
      await spacesService.list({ startTime, endTime });
      expect(where().AND).toEqual([
        {
          bookings: {
            none: {
              status: { not: BookingStatus.CANCELED },
              startTime: { lt: endTime },
              endTime: { gt: startTime },
            },
          },
        },
      ]);
    });

    it("includes bookings only when asked", async () => {
      db.space.findMany.mockResolvedValue([]);
      await spacesService.list({});
      expect(db.space.findMany.mock.calls[0][0].include).toBeUndefined();
      await spacesService.list({}, { includeBookings: true });
      expect(db.space.findMany.mock.calls[1][0].include).toHaveProperty("bookings");
    });
  });

  describe("getActiveById", () => {
    it("404 when missing or inactive", async () => {
      db.space.findUnique.mockResolvedValue(null);
      await expect(spacesService.getActiveById(1)).rejects.toMatchObject({ statusCode: 404 });
      db.space.findUnique.mockResolvedValue(makeSpace({ isActive: false }));
      await expect(spacesService.getActiveById(1)).rejects.toMatchObject({ statusCode: 404 });
    });

    it("returns an active space", async () => {
      db.space.findUnique.mockResolvedValue(makeSpace());
      await expect(spacesService.getActiveById(1)).resolves.toMatchObject({ id: 1 });
    });
  });

  it("getById also finds inactive spaces", async () => {
    db.space.findUnique.mockResolvedValue(makeSpace({ isActive: false }));
    await expect(spacesService.getById(1)).resolves.toMatchObject({ isActive: false });
  });

  it("create delegates to prisma", async () => {
    const data = {
      name: "A",
      type: SpaceType.INDIVIDUAL_DESK,
      capacity: 1,
      pricePerHour: 5,
      location: "L",
    };
    db.space.create.mockResolvedValue(makeSpace());
    await spacesService.create(data);
    expect(db.space.create).toHaveBeenCalledWith({ data });
  });

  describe("update / deactivate", () => {
    it("404 when the space does not exist", async () => {
      db.space.findUnique.mockResolvedValue(null);
      await expect(spacesService.update(1, { name: "x" })).rejects.toMatchObject({
        statusCode: 404,
      });
      await expect(spacesService.deactivate(1)).rejects.toMatchObject({ statusCode: 404 });
      expect(db.space.update).not.toHaveBeenCalled();
    });

    it("update changes only the given fields", async () => {
      db.space.findUnique.mockResolvedValue(makeSpace());
      db.space.update.mockResolvedValue(makeSpace());
      await spacesService.update(1, { name: "New" });
      expect(db.space.update).toHaveBeenCalledWith({ where: { id: 1 }, data: { name: "New" } });
    });

    it("deactivate is a soft delete", async () => {
      db.space.findUnique.mockResolvedValue(makeSpace());
      db.space.update.mockResolvedValue(makeSpace({ isActive: false }));
      await spacesService.deactivate(1);
      expect(db.space.update).toHaveBeenCalledWith({ where: { id: 1 }, data: { isActive: false } });
    });
  });
});
