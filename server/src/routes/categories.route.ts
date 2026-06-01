import { Router } from 'express'
import { list, create, update, remove } from '../controllers/categories.controller'
import { authenticate, authorize } from '../middlewares/auth.middleware'

const router = Router()

router.get('/', authenticate, list)
router.post('/', authenticate, authorize('ADMIN'), create)
router.put('/:id', authenticate, authorize('ADMIN'), update)
router.delete('/:id', authenticate, authorize('ADMIN'), remove)

export default router
