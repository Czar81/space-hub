/*
  Aligns SpaceType with the client's business, one to one:
  escritorio individual -> INDIVIDUAL_DESK, sala privada -> PRIVATE_ROOM, suite empresarial -> ENTERPRISE_SUITE.
  RENAME VALUE keeps every existing row, only the label changes.
*/
ALTER TYPE "SpaceType" RENAME VALUE 'HOT_DESK' TO 'INDIVIDUAL_DESK';
ALTER TYPE "SpaceType" RENAME VALUE 'MEETING_ROOM' TO 'PRIVATE_ROOM';
ALTER TYPE "SpaceType" RENAME VALUE 'PRIVATE_OFFICE' TO 'ENTERPRISE_SUITE';
