import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './stores/auth.store'
import { LoginPage } from './features/auth'
import { BranchesPage } from './features/branches'
import { UsersPage } from './features/users'
import { CategoriesPage } from './features/categories'
import { ProductsPage } from './features/products'
import { AppLayout } from './components/layout/AppLayout'
import { PageHeader } from './components/layout/PageHeader'

function PlaceholderPage({ title, description }: { title: string; description?: string }) {
  return (
    <AppLayout>
      <PageHeader title={title} description={description} />
      <div className="flex flex-col items-center justify-center h-64 p-8">
        <div className="text-5xl mb-4">🍊</div>
        <p className="text-stone-500 text-sm">Halaman ini sedang dalam pengembangan</p>
      </div>
    </AppLayout>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  const { isAuthenticated } = useAuthStore()

  return (
    <>
      <Routes>
        {/* Public */}
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />}
        />

        {/* Protected — Phase 2 Master Data */}
        <Route path="/dashboard" element={<ProtectedRoute><PlaceholderPage title="Dashboard" description="Ringkasan data penjualan dan stok" /></ProtectedRoute>} />
        <Route path="/branches" element={<ProtectedRoute><BranchesPage /></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute><UsersPage /></ProtectedRoute>} />
        <Route path="/categories" element={<ProtectedRoute><CategoriesPage /></ProtectedRoute>} />
        <Route path="/products" element={<ProtectedRoute><ProductsPage /></ProtectedRoute>} />

        {/* Placeholder — Phase 3+ */}
        <Route path="/pos" element={<ProtectedRoute><PlaceholderPage title="Kasir" description="Modul kasir — coming soon" /></ProtectedRoute>} />
        <Route path="/stock" element={<ProtectedRoute><PlaceholderPage title="Stok" description="Manajemen stok per cabang" /></ProtectedRoute>} />
        <Route path="/warehouse" element={<ProtectedRoute><PlaceholderPage title="Gudang" description="Monitoring stok gudang" /></ProtectedRoute>} />
        <Route path="/restock" element={<ProtectedRoute><PlaceholderPage title="Restok" description="Permintaan restok cabang" /></ProtectedRoute>} />
        <Route path="/transactions" element={<ProtectedRoute><PlaceholderPage title="Transaksi" description="Riwayat transaksi" /></ProtectedRoute>} />
        <Route path="/customers" element={<ProtectedRoute><PlaceholderPage title="Pelanggan" description="Data pelanggan" /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><PlaceholderPage title="Laporan" description="Laporan penjualan dan profit" /></ProtectedRoute>} />

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>

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
