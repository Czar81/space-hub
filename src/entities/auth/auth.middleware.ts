import { Request, Response, NextFunction } from 'express'
import { jwtService } from '@/core/services/jwt/jwt.service'

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization

  const token = jwtService.extractToken(authHeader)

  if (!token) {
    return res.status(401).json({ error: 'Token required' })
  }

  try {
    req.user = jwtService.verify(token)
    next()
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}
