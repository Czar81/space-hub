import { MembershipPlan, SpaceType, UserRole } from '@prisma/client'

export interface AuthUser {
  userId: number
  email: string
  role: UserRole
}

export interface CreateSpaceBody {
  name: string
  type: SpaceType
  capacity: number
  pricePerHour: number
  isActive?: boolean
}

export interface CreateBookingBody {
  spaceId: string
  startTime: string
  endTime: string
}

export interface UpdateMembershipBody {
  plan: MembershipPlan
}

export enum Environments {
  Development,
  Production,
  Test,
}

// dividir
