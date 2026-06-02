import { Router, Request, Response } from 'express'
import path from 'path'
import { list, create, getById, getByBarcode, update, remove } from '../controllers/products.controller'
import { authenticate, authorize } from '../middlewares/auth.middleware'
import { uploadImage } from '../middlewares/upload.middleware'
import { asyncHandler } from '../utils/asyncHandler'
import { sendSuccess } from '../utils/response'

const router = Router()

// Upload image — returns { url } for use in product form
router.post(
  '/upload-image',
  authenticate,
  authorize('ADMIN'),
  uploadImage.single('image'),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) throw new Error('File tidak ditemukan')
    const baseUrl = `${req.protocol}://${req.get('host')}`
    const url = `${baseUrl}/uploads/${req.file.filename}`
    return sendSuccess(res, { url }, 'Gambar berhasil diupload')
  }),
)

router.get('/', authenticate, list)
router.post('/', authenticate, authorize('ADMIN'), create)
// barcode route MUST be before /:id
router.get('/barcode/:barcode', authenticate, getByBarcode)
router.get('/:id', authenticate, getById)
router.put('/:id', authenticate, authorize('ADMIN'), update)
router.delete('/:id', authenticate, authorize('ADMIN'), remove)

export default router
