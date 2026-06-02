import { Router } from 'express'
import { summary, sales, profit, stock } from '../controllers/reports.controller'
import { authenticate } from '../middlewares/auth.middleware'

const router = Router()

router.get('/summary', authenticate, summary)
router.get('/sales',   authenticate, sales)
router.get('/profit',  authenticate, profit)
router.get('/stock',   authenticate, stock)

export default router
