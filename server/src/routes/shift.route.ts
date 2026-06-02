import { Router } from 'express'
import { getActive, open, summary, close, list } from '../controllers/shift.controller'
import { authenticate } from '../middlewares/auth.middleware'

const router = Router()

router.get('/active',       authenticate, getActive)
router.post('/',            authenticate, open)
router.get('/:id/summary',  authenticate, summary)
router.put('/:id/close',    authenticate, close)
router.get('/',             authenticate, list)

export default router
