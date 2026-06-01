import { Router } from 'express'
import authRoutes from './auth.route'
import branchRoutes from './branches.route'
import userRoutes from './users.route'
import categoryRoutes from './categories.route'
import productRoutes from './products.route'
import stockRoutes from './stock.route'
import restockRoutes from './restock.route'
import transactionRoutes from './transactions.route'
import heldTransactionRoutes from './held-transactions.route'
// import customerRoutes from './customers.route'
// import reportRoutes from './reports.route'

const router = Router()

router.use('/auth', authRoutes)
router.use('/branches', branchRoutes)
router.use('/users', userRoutes)
router.use('/categories', categoryRoutes)
router.use('/products', productRoutes)
router.use('/stock', stockRoutes)
router.use('/restock-requests', restockRoutes)
router.use('/transactions', transactionRoutes)
router.use('/held-transactions', heldTransactionRoutes)

router.get('/health', (_, res) => {
  res.json({ success: true, message: 'POS O-JERUK API is running 🍊', timestamp: new Date() })
})

export default router
