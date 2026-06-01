import { Router } from 'express'
import {
  list, lowStock, byBranch, listMovements, adjustment,
} from '../controllers/stock.controller'
import { authenticate, authorize, ownBranch } from '../middlewares/auth.middleware'

const router = Router()

router.use(authenticate)

router.get('/',                list)
router.get('/low',             lowStock)
router.get('/movements',       listMovements)
router.post('/adjustment',     authorize('ADMIN', 'WAREHOUSE'), adjustment)
router.get('/branch/:branchId', ownBranch, byBranch)

export default router
