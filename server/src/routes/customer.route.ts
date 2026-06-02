import { Router } from 'express'
import { list, create, getById, update, remove } from '../controllers/customer.controller'
import { authenticate, authorize } from '../middlewares/auth.middleware'

const router = Router()

router.get('/',     authenticate, list)
router.post('/',    authenticate, create)
router.get('/:id',  authenticate, getById)
router.put('/:id',  authenticate, update)
router.delete('/:id', authenticate, authorize('ADMIN'), remove)

export default router
