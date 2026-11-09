import prisma from "@/lib/prisma";
import { MembershipPlan, UserRole, User } from "@prisma/client";
import bcrypt from "bcryptjs";
import { AppError } from "@/core/utils/app-error";
import { CreateUserData } from "@/entities/users/users.types";

/** bcrypt cost factor. */
const SALT_ROUNDS = 10;
/**
 * Hash compared when the email does not exist, so an unknown email costs the same bcrypt work
 * as a wrong password and response times do not reveal which emails are registered.
 * Same cost factor as real hashes; computed once at startup.
 */
const DUMMY_PASSWORD_HASH = bcrypt.hashSync("spacehub-timing-equalizer", SALT_ROUNDS);
/** Duration of the BASIC membership every new user receives. */
const DEFAULT_MEMBERSHIP_MONTHS = 12;

/** User persistence and password handling. */
export const usersService = {
  /**
   * Finds a user by email.
   *
   * @param email Email to look up.
   * @returns The user, or `null` when it does not exist.
   */
  async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },

  /**
   * Finds a user by id.
   *
   * @param id User id.
   * @returns The user, or `null` when it does not exist.
   */
  async findById(id: number) {
    return prisma.user.findUnique({ where: { id } });
  },

  /**
   * Registers a MEMBER with a bcrypt hashed password and a BASIC membership valid for 12 months.
   *
   * @param data Name, email and plain text password.
   * @returns The created user, including the password hash (use `toPublic` before sending it).
   * @throws AppError 409 when the email is already registered.
   */
  async create(data: CreateUserData) {
    const existing = await this.findByEmail(data.email);
    if (existing) {
      throw AppError.conflict("Email already registered");
    }

    const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

    const membershipEndDate = new Date();
    membershipEndDate.setMonth(membershipEndDate.getMonth() + DEFAULT_MEMBERSHIP_MONTHS);

    return prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: UserRole.MEMBER,
        membership: {
          create: { plan: MembershipPlan.BASIC, endDate: membershipEndDate },
        },
      },
    });
  },

  /**
   * Removes sensitive fields (password hash, timestamps) before a user is sent to the client.
   *
   * @param user User row from the database.
   * @returns `{ id, name, email, role }`.
   */
  toPublic(user: User) {
    return { id: user.id, name: user.name, email: user.email, role: user.role };
  },

  /**
   * Compares a plain password with its bcrypt hash.
   * Without a hash (unknown user) it still runs a full `bcrypt.compare` against a dummy hash and
   * returns `false`, so both failure cases take the same time.
   *
   * @param plainPassword Password typed by the user.
   * @param hashedPassword Hash stored in the database, or `null`/`undefined` when the user does not exist.
   * @returns `true` when they match.
   */
  async verifyPassword(plainPassword: string, hashedPassword?: string | null) {
    const matches = await bcrypt.compare(plainPassword, hashedPassword ?? DUMMY_PASSWORD_HASH);
    return Boolean(hashedPassword) && matches;
  },
};
