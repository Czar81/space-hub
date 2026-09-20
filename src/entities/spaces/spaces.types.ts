import { SpaceType } from "@prisma/client";

export interface CreateSpaceBody {
  name: string;
  type: SpaceType;
  capacity: number;
  pricePerHour: number;
  isActive?: boolean;
}