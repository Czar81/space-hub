/*
  Aligns the database with prisma/schema.prisma preserving existing data:
  - text columns become native enums (values are upper-cased: 'member' -> 'MEMBER').
  - Booking.totalPrice becomes DECIMAL(10,2) and is recalculated from the booking
    duration and the space price, because the stored values were corrupted.
  - Space.location is added; existing spaces get a placeholder location.
*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "SpaceType" AS ENUM ('HOT_DESK', 'MEETING_ROOM', 'PRIVATE_OFFICE');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELED');

-- CreateEnum
CREATE TYPE "MembershipPlan" AS ENUM ('BASIC', 'PRO', 'ENTERPRISE');

-- AlterTable User
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole" USING UPPER("role")::"UserRole";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'MEMBER';

-- AlterTable Space
ALTER TABLE "Space" ALTER COLUMN "type" TYPE "SpaceType" USING UPPER("type")::"SpaceType";
ALTER TABLE "Space" ADD COLUMN "location" TEXT NOT NULL DEFAULT 'Sede Principal';
ALTER TABLE "Space" ALTER COLUMN "location" DROP DEFAULT;

-- AlterTable Membership
ALTER TABLE "Membership" ALTER COLUMN "plan" DROP DEFAULT;
ALTER TABLE "Membership" ALTER COLUMN "plan" TYPE "MembershipPlan" USING UPPER("plan")::"MembershipPlan";
ALTER TABLE "Membership" ALTER COLUMN "plan" SET DEFAULT 'BASIC';

-- AlterTable Booking
ALTER TABLE "Booking" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Booking" ALTER COLUMN "status" TYPE "BookingStatus" USING UPPER("status")::"BookingStatus";
ALTER TABLE "Booking" ALTER COLUMN "status" SET DEFAULT 'CONFIRMED';

ALTER TABLE "Booking" ADD COLUMN "totalPriceNew" DECIMAL(10,2);
UPDATE "Booking" b
SET "totalPriceNew" = ROUND(EXTRACT(EPOCH FROM (b."endTime" - b."startTime")) / 3600 * s."pricePerHour", 2)
FROM "Space" s
WHERE s."id" = b."spaceId";
ALTER TABLE "Booking" DROP COLUMN "totalPrice";
ALTER TABLE "Booking" RENAME COLUMN "totalPriceNew" TO "totalPrice";
ALTER TABLE "Booking" ALTER COLUMN "totalPrice" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Booking_spaceId_startTime_endTime_idx" ON "Booking"("spaceId", "startTime", "endTime");

-- CreateIndex
CREATE INDEX "Booking_userId_idx" ON "Booking"("userId");

-- CreateIndex
CREATE INDEX "Space_isActive_type_idx" ON "Space"("isActive", "type");
