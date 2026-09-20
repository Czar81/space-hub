import { JwtUserPayload } from '@/core/services/jwt/jwt.types'

declare global {
  namespace Express {
    interface Request {
      user?: JwtUserPayload
    }
  }
}
