/// <reference types="node" />

import prisma from "../src/lib/prisma";
import bcrypt from "bcryptjs";
import { BookingStatus, MembershipPlan, SpaceType, UserRole } from "@prisma/client";

/**
 * Resets the database and loads demo data: an admin, two members (password `password123`), their memberships, three spaces and two bookings.
 * Destructive: every existing row is deleted first, never run it against production data.
 */
async function main() {
  console.log("Starting database seeding...");

  // Clean existing data (in order due to foreign key constraints)
  await prisma.booking.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.user.deleteMany();
  await prisma.space.deleteMany();

  console.log("Database cleaned.");

  // Create Users (Admin and Members)
  const passwordHash = await bcrypt.hash("password123", 10);

  const adminUser = await prisma.user.create({
    data: {
      name: "Admin SpaceHub",
      email: "admin@spacehub.com",
      password: passwordHash,
      role: UserRole.ADMIN,
    },
  });

  const memberUser1 = await prisma.user.create({
    data: {
      name: "John Doe",
      email: "john@example.com",
      password: passwordHash,
      role: UserRole.MEMBER,
    },
  });

  const memberUser2 = await prisma.user.create({
    data: {
      name: "Jane Smith",
      email: "jane@example.com",
      password: passwordHash,
      role: UserRole.MEMBER,
    },
  });

  console.log("Users created (Default password: password123).");

  const membershipEndDate = new Date();
  membershipEndDate.setFullYear(membershipEndDate.getFullYear() + 1);

  await prisma.membership.createMany({
    data: [
      { userId: adminUser.id, plan: MembershipPlan.ENTERPRISE, endDate: membershipEndDate },
      { userId: memberUser1.id, plan: MembershipPlan.PRO, endDate: membershipEndDate },
      { userId: memberUser2.id, plan: MembershipPlan.BASIC, endDate: membershipEndDate },
    ],
  });

  console.log("Memberships created.");

  // Create Coworking Spaces
  const hotDesk = await prisma.space.create({
    data: {
      name: "Hot Desk Zone A",
      type: SpaceType.HOT_DESK,
      capacity: 15,
      pricePerHour: 5,
      location: "San José - Sede Centro",
      isActive: true,
    },
  });

  const meetingRoom = await prisma.space.create({
    data: {
      name: "Innovation Meeting Room",
      type: SpaceType.MEETING_ROOM,
      capacity: 8,
      pricePerHour: 25,
      location: "San José - Sede Centro",
      isActive: true,
    },
  });

  await prisma.space.create({
    data: {
      name: "Private Office 101",
      type: SpaceType.PRIVATE_OFFICE,
      capacity: 4,
      pricePerHour: 45,
      location: "Heredia - Sede Norte",
      isActive: true,
    },
  });

  console.log("Spaces created.");

  // Create Sample bookings
  const now = new Date();

  // booking 1: Tomorrow in the meeting room
  const tomorrowStart = new Date(now);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  tomorrowStart.setHours(10, 0, 0, 0);

  const tomorrowEnd = new Date(tomorrowStart);
  tomorrowEnd.setHours(12, 0, 0, 0);

  await prisma.booking.create({
    data: {
      userId: memberUser1.id,
      spaceId: meetingRoom.id,
      startTime: tomorrowStart,
      endTime: tomorrowEnd,
      totalPrice: "50.00",
      status: BookingStatus.CONFIRMED,
    },
  });

  // booking 2: Day after tomorrow at Hot Desk
  const dayAfterStart = new Date(now);
  dayAfterStart.setDate(dayAfterStart.getDate() + 2);
  dayAfterStart.setHours(14, 0, 0, 0);

  const dayAfterEnd = new Date(dayAfterStart);
  dayAfterEnd.setHours(18, 0, 0, 0);

  await prisma.booking.create({
    data: {
      userId: memberUser2.id,
      spaceId: hotDesk.id,
      startTime: dayAfterStart,
      endTime: dayAfterEnd,
      totalPrice: "20.00",
      status: BookingStatus.CONFIRMED,
    },
  });

  console.log("Sample bookings created.");
  console.log("Database seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error("Error executing seed script:", e);
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
