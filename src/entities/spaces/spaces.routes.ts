import { Router } from 'express'
import { SpaceType } from '@prisma/client'
import prisma from '@/lib/prisma'
import { authenticate } from '@/entities/auth/auth.middleware'

const router = Router()

router.get('/', async (req, res) => {
  const { type, minCapacity } = req.query

  const filters: any = {}

  if (type) {
    filters.type = type as SpaceType
  }

  // TODO: filter by minCapacity
  // TODO: filter by availability on date

  try {
    const spaces = await prisma.space.findMany({ where: filters })
    res.json(spaces)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/:id', async (req, res) => {
  const { id } = req.params

  try {
    const space = await prisma.space.findUnique({
      where: { id: parseInt(id) }
    })

    if (!space) {
      return res.status(404).json({ error: 'Space not found' })
    }

    res.json(space)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/', async (req, res) => {
  const { name, type, capacity, pricePerHour } = req.body

  try {
    const space = await prisma.space.create({
      data: { name, type, capacity, pricePerHour, isActive: true }
    })
    res.status(201).json(space)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

router.put('/:id', authenticate, async (req, res) => {
  // TODO: implement space update
  res.status(501).json({ message: 'Not implemented' })
})

router.delete('/:id', authenticate, async (req, res) => {
  const { id } = req.params

  try {
    await prisma.space.delete({ where: { id: parseInt(id) } })
    res.json({ message: 'Space deleted' })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

export default router
