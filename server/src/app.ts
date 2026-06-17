import express from 'express'
import path from 'path'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import router from './routes'
import { errorHandler } from './middlewares/error.middleware'

const app = express()

app.use(helmet())
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}))
app.use(morgan('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { success: false, message: 'Terlalu banyak request, coba lagi nanti' },
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Terlalu banyak percobaan login, coba lagi dalam 15 menit' },
})

app.use('/api/v1', limiter)
app.use('/api/v1/auth/login',   authLimiter)
app.use('/api/v1/auth/refresh', rateLimit({ windowMs: 15 * 60 * 1000, max: 30, message: { success: false, message: 'Terlalu banyak request, coba lagi nanti' } }))
app.use('/api/v1', router)

app.use(errorHandler)

export default app
