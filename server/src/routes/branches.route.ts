import { Router } from 'express'
import { list, create, getById, update, remove } from '../controllers/branches.controller'
import { authenticate, authorize } from '../middlewares/auth.middleware'

const router = Router()

router.use(authenticate)

router.get('/', authorize('ADMIN', 'WAREHOUSE'), list)
router.post('/', authorize('ADMIN'), create)
router.get('/:id', authorize('ADMIN', 'WAREHOUSE'), getById)
router.put('/:id', authorize('ADMIN'), update)
router.delete('/:id', authorize('ADMIN'), remove)

export default router
