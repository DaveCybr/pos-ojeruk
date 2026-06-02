import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './stores/auth.store'
import { PageLoader } from './components/ui/PageLoader'
import type { Role } from './types'

// Lazy-loaded pages — each chunk only loads when needed
const LoginPage          = lazy(() => import('./features/auth').then(m => ({ default: m.LoginPage })))
const DashboardPage      = lazy(() => import('./features/dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })))
const BranchesPage       = lazy(() => import('./features/branches').then(m => ({ default: m.BranchesPage })))
const UsersPage          = lazy(() => import('./features/users').then(m => ({ default: m.UsersPage })))
const CategoriesPage     = lazy(() => import('./features/categories').then(m => ({ default: m.CategoriesPage })))
const ProductsPage       = lazy(() => import('./features/products').then(m => ({ default: m.ProductsPage })))
const StockPage          = lazy(() => import('./features/stock').then(m => ({ default: m.StockPage })))
const StockMovementsPage = lazy(() => import('./features/stock').then(m => ({ default: m.StockMovementsPage })))
const WarehousePage      = lazy(() => import('./features/warehouse').then(m => ({ default: m.WarehousePage })))
const POSPage            = lazy(() => import('./features/pos').then(m => ({ default: m.POSPage })))
const TransactionsPage   = lazy(() => import('./features/transactions/TransactionsPage').then(m => ({ default: m.TransactionsPage })))
const CustomersPage      = lazy(() => import('./features/customers/CustomersPage').then(m => ({ default: m.CustomersPage })))
const ReportsPage        = lazy(() => import('./features/reports/ReportsPage').then(m => ({ default: m.ReportsPage })))


function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: Role[] }) {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (roles && user?.role && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

export default function App() {
  const { isAuthenticated } = useAuthStore()

  return (
    <>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public */}
          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />}
          />

          {/* Dashboard */}
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Master Data */}
          <Route path="/branches"   element={<ProtectedRoute roles={['ADMIN']}><BranchesPage /></ProtectedRoute>} />
          <Route path="/users"      element={<ProtectedRoute roles={['ADMIN']}><UsersPage /></ProtectedRoute>} />
          <Route path="/categories" element={<ProtectedRoute roles={['ADMIN']}><CategoriesPage /></ProtectedRoute>} />
          <Route path="/products"   element={<ProtectedRoute roles={['ADMIN', 'CASHIER']}><ProductsPage /></ProtectedRoute>} />

          {/* Stock & Warehouse */}
          <Route path="/stock"           element={<ProtectedRoute><StockPage /></ProtectedRoute>} />
          <Route path="/stock/movements" element={<ProtectedRoute><StockMovementsPage /></ProtectedRoute>} />
          <Route path="/warehouse"       element={<ProtectedRoute roles={['ADMIN', 'WAREHOUSE']}><WarehousePage /></ProtectedRoute>} />
          <Route path="/restock"         element={<ProtectedRoute><WarehousePage /></ProtectedRoute>} />

          {/* POS */}
          <Route path="/pos"          element={<ProtectedRoute><POSPage /></ProtectedRoute>} />
          <Route path="/transactions" element={<ProtectedRoute><TransactionsPage /></ProtectedRoute>} />
          <Route path="/customers"    element={<ProtectedRoute><CustomersPage /></ProtectedRoute>} />

          {/* Reports */}
          <Route path="/reports" element={<ProtectedRoute roles={['ADMIN', 'WAREHOUSE']}><ReportsPage /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>

      <Toaster
        position="bottom-right"
        toastOptions={{
          style: { borderRadius: '10px', fontSize: '14px' },
          success: { style: { background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d' } },
          error:   { style: { background: '#fff1f2', border: '1px solid #fecdd3', color: '#b91c1c' } },
        }}
      />
    </>
  )
}
