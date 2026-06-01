import { Router } from 'express'
import { list, create, getById, getByBarcode, update, remove } from '../controllers/products.controller'
import { authenticate, authorize } from '../middlewares/auth.middleware'

const router = Router()

router.get('/', authenticate, list)
router.post('/', authenticate, authorize('ADMIN'), create)
// barcode route MUST be before /:id to avoid param collision
router.get('/barcode/:barcode', authenticate, getByBarcode)
router.get('/:id', authenticate, getById)
router.put('/:id', authenticate, authorize('ADMIN'), update)
router.delete('/:id', authenticate, authorize('ADMIN'), remove)

export default router
