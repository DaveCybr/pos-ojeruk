import { Router } from 'express'
import { list, create, getById, getByBranch, voidTx } from '../controllers/transactions.controller'
import { authenticate, authorize, ownBranch } from '../middlewares/auth.middleware'

const router = Router()

router.use(authenticate)

router.get('/', list)
router.post('/', authorize('ADMIN', 'CASHIER'), create)
// branch/:id must come before /:id
router.get('/branch/:id', ownBranch, getByBranch)
router.get('/:id', getById)
router.put('/:id/void', authorize('ADMIN'), voidTx)

export default router
