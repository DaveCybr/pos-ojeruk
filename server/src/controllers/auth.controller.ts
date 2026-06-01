import { Request, Response } from 'express'
import { z } from 'zod'
import { asyncHandler } from '../utils/asyncHandler'
import { sendSuccess, sendError } from '../utils/response'
import { AuthRequest } from '../middlewares/auth.middleware'
import * as authService from '../services/auth.service'

const loginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
})

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
}

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = loginSchema.parse(req.body)
  const { user, accessToken, refreshToken } = await authService.loginUser(email, password)

  res.cookie('refresh_token', refreshToken, COOKIE_OPTIONS)
  return sendSuccess(res, { user, access_token: accessToken }, 'Login berhasil')
})

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const token: string | undefined = req.cookies?.refresh_token
  if (!token) return sendError(res, 'Refresh token tidak ditemukan', 401)

  try {
    const { accessToken, user } = await authService.refreshTokenService(token)
    return sendSuccess(res, { user, access_token: accessToken }, 'Token diperbarui')
  } catch {
    res.clearCookie('refresh_token')
    return sendError(res, 'Refresh token tidak valid atau sudah expired', 401)
  }
})

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  res.clearCookie('refresh_token')
  return sendSuccess(res, null, 'Logout berhasil')
})

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.getUserById((req as AuthRequest).user!.id)
  if (!user) return sendError(res, 'User tidak ditemukan', 404)
  return sendSuccess(res, user, 'Data user berhasil diambil')
})
