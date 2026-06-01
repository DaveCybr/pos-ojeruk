import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { AppError } from '../utils/errors'

export const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (process.env.NODE_ENV !== 'test') console.error(err)

  if (err instanceof ZodError) {
    return res.status(422).json({
      success: false,
      message: 'Validasi gagal',
      errors: err.errors.map(e => ({ field: e.path.join('.'), message: e.message })),
    })
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ success: false, message: err.message })
  }

  if (err instanceof Error) {
    return res.status(500).json({ success: false, message: err.message })
  }

  return res.status(500).json({ success: false, message: 'Internal server error' })
}
