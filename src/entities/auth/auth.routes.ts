import { Router } from 'express'
import { createHash } from 'crypto'
import { UserRole } from '@prisma/client'
import prisma from '@/lib/prisma'
import { jwtService } from '@/core/services/jwt/jwt.service'

const router = Router()

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

    const token = jwtService.sign({ userId: user.id, email: user.email })

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

    const token = jwtService.sign({ userId: user.id, email: user.email })

    res.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      token
    })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

export default router
