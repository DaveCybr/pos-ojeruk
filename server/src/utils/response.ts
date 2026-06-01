import { Response } from 'express'

export const sendSuccess = (res: Response, data: unknown, message = 'Berhasil', statusCode = 200) => {
  return res.status(statusCode).json({ success: true, message, data })
}

export const sendList = (
  res: Response,
  data: unknown[],
  meta: { total: number; page: number; per_page: number; last_page: number },
  message = 'Berhasil'
) => {
  return res.status(200).json({ success: true, message, data, meta })
}

export const sendError = (res: Response, message: string, statusCode = 500, errors?: unknown) => {
  const body: Record<string, unknown> = { success: false, message }
  if (errors !== undefined) body.errors = errors
  return res.status(statusCode).json(body)
}
