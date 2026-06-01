import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { sendError } from '../utils/response'
import { Role } from '@prisma/client'

export interface AuthRequest extends Request {
  user?: { id: string; email: string; role: Role; branchId: string | null }
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return sendError(res, 'Token tidak ditemukan', 401)

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string; email: string; role: Role; branchId: string | null
    }
    req.user = decoded
    next()
  } catch {
    return sendError(res, 'Token tidak valid atau sudah expired', 401)
  }
}

export const authorize = (...roles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return sendError(res, 'Anda tidak memiliki akses', 403)
    }
    next()
  }
}

export const ownBranch = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role === 'ADMIN' || req.user?.role === 'WAREHOUSE') return next()
  const branchId = req.params.branch_id || req.body.branchId
  if (branchId && branchId !== req.user?.branchId) {
    return sendError(res, 'Anda hanya bisa mengakses data cabang sendiri', 403)
  }
  next()
}
