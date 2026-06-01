import { Router } from 'express'
import { getByBranch, create, remove } from '../controllers/held-transactions.controller'
import { authenticate, ownBranch } from '../middlewares/auth.middleware'

const router = Router()

router.use(authenticate)

router.get('/branch/:branchId', ownBranch, getByBranch)
router.post('/', create)
router.delete('/:id', remove)

export default router
