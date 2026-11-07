import { SpaceType, UserRole, BookingStatus } from "@prisma/client";
import { AuthUser } from "@/entities/auth/auth.types";

export const makeUser = (overrides = {}) => ({
  id: 1,
  name: "Ana",
  email: "ana@test.com",
  password: "hashed",
  role: UserRole.MEMBER,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
  ...overrides,
});

export const makeSpace = (overrides = {}) => ({
  id: 1,
  name: "Sala A",
  type: SpaceType.MEETING_ROOM,
  capacity: 8,
  pricePerHour: 45,
  location: "Piso 2",
  isActive: true,
  ...overrides,
});

export const makeBooking = (overrides = {}) => ({
  id: 1,
  userId: 1,
  spaceId: 1,
  startTime: new Date("2030-01-01T10:00:00Z"),
  endTime: new Date("2030-01-01T12:00:00Z"),
  status: BookingStatus.CONFIRMED,
  totalPrice: "90.00",
  ...overrides,
});

export const member: AuthUser = { userId: 1, email: "ana@test.com", role: UserRole.MEMBER };
export const admin: AuthUser = { userId: 99, email: "admin@test.com", role: UserRole.ADMIN };
