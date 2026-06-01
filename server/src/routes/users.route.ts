import { Router } from 'express'
import { list, create, getById, update, remove } from '../controllers/users.controller'
import { authenticate, authorize } from '../middlewares/auth.middleware'

const router = Router()

router.use(authenticate, authorize('ADMIN'))

router.get('/', list)
router.post('/', create)
router.get('/:id', getById)
router.put('/:id', update)
router.delete('/:id', remove)

export default router
