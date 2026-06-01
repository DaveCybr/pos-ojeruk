import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, ShoppingCart, Package, Tag, Boxes,
  Warehouse, PackagePlus, Receipt, BarChart3, Users,
  Store, UserCircle, LogOut,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../stores/auth.store'
import { authApi } from '../../features/auth/api'
import type { Role } from '../../types'

interface NavItem {
  to: string
  icon: React.ElementType
  label: string
  roles: Role[]
  section?: string
}

const navItems: NavItem[] = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['ADMIN', 'WAREHOUSE', 'CASHIER'] },
  { to: '/pos', icon: ShoppingCart, label: 'Kasir', roles: ['ADMIN', 'CASHIER'], section: 'Operasional' },
  { to: '/transactions', icon: Receipt, label: 'Transaksi', roles: ['ADMIN', 'CASHIER'] },
  { to: '/customers', icon: Users, label: 'Pelanggan', roles: ['ADMIN', 'CASHIER'] },
  { to: '/stock', icon: Boxes, label: 'Stok', roles: ['ADMIN', 'WAREHOUSE', 'CASHIER'], section: 'Inventori' },
  { to: '/warehouse', icon: Warehouse, label: 'Gudang', roles: ['ADMIN', 'WAREHOUSE'] },
  { to: '/restock', icon: PackagePlus, label: 'Restok', roles: ['ADMIN', 'WAREHOUSE', 'CASHIER'] },
  { to: '/products', icon: Package, label: 'Produk', roles: ['ADMIN', 'CASHIER'], section: 'Master Data' },
  { to: '/categories', icon: Tag, label: 'Kategori', roles: ['ADMIN'] },
  { to: '/branches', icon: Store, label: 'Cabang', roles: ['ADMIN'] },
  { to: '/users', icon: UserCircle, label: 'Pengguna', roles: ['ADMIN'] },
  { to: '/reports', icon: BarChart3, label: 'Laporan', roles: ['ADMIN'], section: 'Analitik' },
]

export function Sidebar() {
  const { user, clearAuth } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try { await authApi.logout() } catch { /* ignore */ }
    clearAuth()
    toast.success('Berhasil keluar')
    navigate('/login', { replace: true })
  }

  const visibleItems = navItems.filter(item => user?.role && item.roles.includes(user.role))

  let lastSection = ''

  return (
    <aside className="w-64 bg-stone-100 border-r border-stone-200 h-screen flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-stone-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center shadow-sm">
            <span className="text-lg">🍊</span>
          </div>
          <div>
            <p className="text-sm font-bold text-stone-900">POS O-JERUK</p>
            <p className="text-[11px] text-stone-400">Fezora Technology</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3">
        {visibleItems.map((item) => {
          const showSection = item.section && item.section !== lastSection
          if (item.section) lastSection = item.section
          return (
            <div key={item.to}>
              {showSection && (
                <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider px-6 py-2 mt-3">
                  {item.section}
                </p>
              )}
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-lg mx-2 transition-all duration-150 text-sm ${
                    isActive
                      ? 'bg-orange-500 text-white font-medium shadow-sm'
                      : 'text-stone-600 hover:bg-stone-200 hover:text-stone-900'
                  }`
                }
              >
                <item.icon size={20} className="flex-shrink-0" />
                {item.label}
              </NavLink>
            </div>
          )
        })}
      </nav>

      {/* User info + logout */}
      <div className="border-t border-stone-200 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
            <span className="text-sm font-semibold text-orange-600">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-stone-800 truncate">{user?.name}</p>
            <p className="text-[11px] text-stone-400">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-stone-600
            hover:bg-red-50 hover:text-red-600 transition-colors duration-150"
        >
          <LogOut size={16} />
          Keluar
        </button>
      </div>
    </aside>
  )
}
