import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma'

const ACCESS_EXPIRES = '15m'
const REFRESH_EXPIRES = '7d'

function signAccessToken(payload: { id: string; email: string; role: string; branchId: string | null }) {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: ACCESS_EXPIRES })
}

function signRefreshToken(id: string) {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET!, { expiresIn: REFRESH_EXPIRES })
}

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  branchId: true,
  createdAt: true,
  branch: { select: { id: true, name: true, city: true } },
} as const

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email }, include: { branch: { select: { id: true, name: true, city: true } } } })
  if (!user) throw new Error('Email atau password salah')

  const isMatch = await bcrypt.compare(password, user.password)
  if (!isMatch) throw new Error('Email atau password salah')

  const accessToken = signAccessToken({ id: user.id, email: user.email, role: user.role, branchId: user.branchId })
  const refreshToken = signRefreshToken(user.id)

  const { password: _pw, ...userSafe } = user
  return { user: userSafe, accessToken, refreshToken }
}

export async function refreshTokenService(token: string) {
  const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as { id: string }

  const user = await prisma.user.findUnique({ where: { id: decoded.id }, include: { branch: { select: { id: true, name: true, city: true } } } })
  if (!user) throw new Error('User tidak ditemukan')

  const accessToken = signAccessToken({ id: user.id, email: user.email, role: user.role, branchId: user.branchId })
  const { password: _pw, ...userSafe } = user
  return { accessToken, user: userSafe }
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({ where: { id }, select: userSelect })
}
