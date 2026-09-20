import { Router } from 'express'
import { createHash } from 'crypto'
import jwt from 'jsonwebtoken'
import { UserRole } from '@prisma/client'
import prisma from '@/lib/prisma'

const router = Router()
const JWT_SECRET = process.env.JWT_SECRET || 'secret123'

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body

  const hashedPassword = createHash('md5').update(password).digest('hex')

  try {
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: UserRole.MEMBER
      }
    })

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET
    )

    res.status(201).json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      token
    })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    const hashedPassword = createHash('md5').update(password).digest('hex')

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user || user.password !== hashedPassword) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET
    )

    res.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      token
    })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

export default router
