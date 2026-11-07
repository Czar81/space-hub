import { describe, it, expect, vi } from "vitest";
import { SpaceType, UserRole } from "@prisma/client";
import prisma from "@/lib/prisma";
import { spacesResolvers } from "@/graphql/resolvers/spaces.resolver";
import { makeSpace } from "../../helpers/factories";

const db = vi.mocked(prisma, true);
const anon = { user: null };
const adminCtx = {
  user: { userId: 1, email: "a@test.com", role: UserRole.ADMIN, type: "access" as const },
};

describe("spacesResolvers.spaces", () => {
  it("returns only active spaces with optional filters", async () => {
    db.space.findMany.mockResolvedValue([]);
    await spacesResolvers.spaces({ type: SpaceType.HOT_DESK, minCapacity: 3 }, anon);
    expect(db.space.findMany.mock.calls[0][0].where).toEqual({
      isActive: true,
      type: SpaceType.HOT_DESK,
      capacity: { gte: 3 },
    });
  });

  it("includes bookings only for admins", async () => {
    db.space.findMany.mockResolvedValue([]);
    await spacesResolvers.spaces({}, anon);
    expect(db.space.findMany.mock.calls[0][0].include).toEqual({});

    await spacesResolvers.spaces({}, adminCtx);
    expect(db.space.findMany.mock.calls[1][0].include).toHaveProperty("bookings");
  });

  it("maps database failures to a 500 AppError", async () => {
    db.space.findMany.mockRejectedValue(new Error("db down"));
    await expect(spacesResolvers.spaces({}, anon)).rejects.toMatchObject({ statusCode: 500 });
  });
});

describe("spacesResolvers.space", () => {
  it("400 for an invalid id", async () => {
    await expect(spacesResolvers.space({ id: "abc" }, anon)).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("404 for missing or inactive spaces", async () => {
    db.space.findUnique.mockResolvedValue(null);
    await expect(spacesResolvers.space({ id: "1" }, anon)).rejects.toMatchObject({
      statusCode: 404,
    });
    db.space.findUnique.mockResolvedValue(makeSpace({ isActive: false }));
    await expect(spacesResolvers.space({ id: "1" }, anon)).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it("returns the active space", async () => {
    db.space.findUnique.mockResolvedValue(makeSpace());
    expect(await spacesResolvers.space({ id: "1" }, anon)).toMatchObject({ id: 1 });
  });

  it("500 on unexpected database errors", async () => {
    db.space.findUnique.mockRejectedValue(new Error("db down"));
    await expect(spacesResolvers.space({ id: "1" }, anon)).rejects.toMatchObject({
      statusCode: 500,
    });
  });
});
