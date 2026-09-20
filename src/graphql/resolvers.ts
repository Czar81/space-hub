import prisma from '@/lib/prisma'
import { BookingStatus, SpaceType } from '@prisma/client'

function formatDates(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj
  if (obj instanceof Date) return obj.toISOString()
  if (Array.isArray(obj)) return obj.map(formatDates)
  const result: any = {}
  for (const [key, value] of Object.entries(obj)) {
    result[key] = formatDates(value)
  }
  return result
}

export const rootValue = {
  spaces: async ({ type, minCapacity }: { type?: SpaceType; minCapacity?: number }) => {
    return formatDates(
      await prisma.space.findMany({
        where: {
          ...(type && { type }),
          ...(minCapacity && { capacity: { gte: minCapacity } })
        },
        include: { bookings: { include: { user: true } } }
      })
    )
  },

  space: async ({ id }: { id: string }) => {
    return formatDates(
      await prisma.space.findUnique({
        where: { id: parseInt(id) },
        include: { bookings: { include: { user: true } } }
      })
    )
  },

  occupancyAnalytics: async () => {
    const spaces = await prisma.space.findMany()
    const totalSpaces = spaces.length

    const confirmedBookings = await prisma.booking.findMany({
      where: { status: BookingStatus.CONFIRMED }
    })
    const occupancyRate = totalSpaces > 0 ? (confirmedBookings.length / totalSpaces) * 100 : 0
    const totalRevenue = confirmedBookings.reduce(
      (sum: number, b: any) => sum + parseFloat(b.totalPrice || '0'), 0
    )

    const soon = new Date()
    soon.setDate(soon.getDate() + 7)
    const expiringList = await prisma.membership.findMany({ where: { endDate: { lte: soon } } })
    const membershipsExpiringSoon = expiringList.length

    const topBookers = await prisma.booking.groupBy({
      by: ['userId'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5
    })
    const topUsersData = await prisma.user.findMany({
      where: { id: { in: topBookers.map((b: any) => b.userId) } }
    })
    const topUsers = topUsersData.map((u: any) => u.name)

    return { totalSpaces, occupancyRate, totalRevenue, membershipsExpiringSoon, topUsers }
  }
}
