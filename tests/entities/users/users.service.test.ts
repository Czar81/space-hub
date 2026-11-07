import { describe, it, expect, vi } from "vitest";
import bcrypt from "bcryptjs";
import { MembershipPlan, UserRole } from "@prisma/client";
import prisma from "@/lib/prisma";
import { usersService } from "@/entities/users/users.service";
import { makeUser } from "../../helpers/factories";

const db = vi.mocked(prisma, true);

describe("usersService", () => {
  describe("create", () => {
    it("409 when the email is already registered", async () => {
      db.user.findUnique.mockResolvedValue(makeUser());
      await expect(
        usersService.create({ name: "A", email: "ana@test.com", password: "12345678" })
      ).rejects.toMatchObject({ statusCode: 409 });
      expect(db.user.create).not.toHaveBeenCalled();
    });

    it("creates a MEMBER with hashed password and a 12 month BASIC membership", async () => {
      db.user.findUnique.mockResolvedValue(null);
      db.user.create.mockResolvedValue(makeUser());

      await usersService.create({ name: "A", email: "a@test.com", password: "12345678" });

      const { data } = db.user.create.mock.calls[0][0];
      expect(data.role).toBe(UserRole.MEMBER);
      expect(data.password).not.toBe("12345678");
      expect(await bcrypt.compare("12345678", data.password)).toBe(true);
      expect(data.membership.create.plan).toBe(MembershipPlan.BASIC);

      const months =
        (data.membership.create.endDate.getFullYear() - new Date().getFullYear()) * 12 +
        data.membership.create.endDate.getMonth() -
        new Date().getMonth();
      expect(months).toBe(12);
    });
  });

  it("findByEmail / findById delegate to prisma", async () => {
    db.user.findUnique.mockResolvedValue(null);
    expect(await usersService.findByEmail("x@test.com")).toBeNull();
    expect(db.user.findUnique).toHaveBeenCalledWith({ where: { email: "x@test.com" } });
    await usersService.findById(3);
    expect(db.user.findUnique).toHaveBeenCalledWith({ where: { id: 3 } });
  });

  it("toPublic strips the password and timestamps", () => {
    expect(usersService.toPublic(makeUser())).toEqual({
      id: 1,
      name: "Ana",
      email: "ana@test.com",
      role: UserRole.MEMBER,
    });
  });

  it("verifyPassword compares against the bcrypt hash", async () => {
    const hash = await bcrypt.hash("secret123", 4);
    expect(await usersService.verifyPassword("secret123", hash)).toBe(true);
    expect(await usersService.verifyPassword("wrong", hash)).toBe(false);
  });
});
