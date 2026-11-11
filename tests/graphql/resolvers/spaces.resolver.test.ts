import { describe, it, expect, vi } from "vitest";
import { SpaceType, UserRole } from "@prisma/client";
import { spacesResolvers } from "@/graphql/resolvers/spaces.resolver";
import { spacesService } from "@/entities/spaces/spaces.service";
import { makeSpace } from "../../helpers/factories";

vi.mock("@/entities/spaces/spaces.service", () => ({
  spacesService: { list: vi.fn(), getActiveById: vi.fn() },
}));

const service = vi.mocked(spacesService);
const anon = { user: null };
const adminCtx = {
  user: { userId: 1, email: "a@test.com", role: UserRole.ADMIN, type: "access" as const },
};

describe("spacesResolvers.spaces", () => {
  it("delegates to spacesService with the validated filters", async () => {
    service.list.mockResolvedValue([]);
    await spacesResolvers.spaces({ type: SpaceType.INDIVIDUAL_DESK, minCapacity: 3 }, anon);
    expect(service.list).toHaveBeenCalledWith(
      { type: SpaceType.INDIVIDUAL_DESK, minCapacity: 3 },
      { includeBookings: false }
    );
  });

  it("supports the date and time range filters, ignoring explicit nulls", async () => {
    service.list.mockResolvedValue([]);
    await spacesResolvers.spaces(
      {
        type: null,
        date: "2030-01-01",
        startTime: "2030-01-01T14:00:00Z",
        endTime: "2030-01-01T16:00:00Z",
      },
      anon
    );
    expect(service.list.mock.calls[0][0]).toEqual({
      date: "2030-01-01",
      startTime: new Date("2030-01-01T14:00:00Z"),
      endTime: new Date("2030-01-01T16:00:00Z"),
    });
  });

  it("400 (not 500) for an invalid type or an incomplete range", async () => {
    await expect(
      spacesResolvers.spaces({ type: "OFFICE" as SpaceType }, anon)
    ).rejects.toMatchObject({ statusCode: 400 });
    await expect(
      spacesResolvers.spaces({ startTime: "2030-01-01T14:00:00Z" }, anon)
    ).rejects.toMatchObject({ statusCode: 400 });
    expect(service.list).not.toHaveBeenCalled();
  });

  it("includes bookings only for admins and formats dates", async () => {
    service.list.mockResolvedValue([
      makeSpace({ createdAt: new Date("2030-01-01T00:00:00Z") }),
    ] as never);
    const [space] = await spacesResolvers.spaces({}, adminCtx);
    expect(service.list).toHaveBeenCalledWith({}, { includeBookings: true });
    expect(space.createdAt).toBe("2030-01-01T00:00:00.000Z");
  });
});

describe("spacesResolvers.space", () => {
  it("400 for an invalid id", async () => {
    await expect(spacesResolvers.space({ id: "abc" }, anon)).rejects.toMatchObject({
      statusCode: 400,
    });
    expect(service.getActiveById).not.toHaveBeenCalled();
  });

  it("delegates to getActiveById (404 comes from the service)", async () => {
    service.getActiveById.mockResolvedValue(makeSpace() as never);
    expect(await spacesResolvers.space({ id: "1" }, anon)).toMatchObject({ id: 1 });
    expect(service.getActiveById).toHaveBeenCalledWith(1, { includeBookings: false });
  });
});
