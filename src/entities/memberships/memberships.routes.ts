import { Router } from 'express'
import { authenticate } from '@/entities/auth/auth.middleware'

const router = Router()

router.get('/', authenticate, async (req, res) => {
  // TODO: query active memberships
  res.json([])
})

router.patch('/:userId', authenticate, async (req, res) => {
  // TODO: update membership plan
  res.status(501).json({ message: 'Not implemented' })
})

export default router
