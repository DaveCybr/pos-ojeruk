import { Router } from 'express'
import { list, create, updateStatus } from '../controllers/restock.controller'
import { authenticate, authorize } from '../middlewares/auth.middleware'

const router = Router()

router.use(authenticate)

router.get('/',         list)
router.post('/',        authorize('ADMIN', 'CASHIER'), create)
router.put('/:id/status', authorize('ADMIN', 'WAREHOUSE'), updateStatus)

export default router
