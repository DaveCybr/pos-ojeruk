import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { LayoutDashboard, ClipboardList, PauseCircle, LogOut } from 'lucide-react'
import { useAuthStore } from '../../stores/auth.store'
import { authApi } from '../../features/auth/api'
import { branchApi } from '../../features/branches/api'
import toast from 'react-hot-toast'

interface POSLayoutProps {
  children: React.ReactNode
  onShowHeld?: () => void
  onShowHistory?: () => void
}

export function POSLayout({ children, onShowHeld, onShowHistory }: POSLayoutProps) {
  const { user, clearAuth } = useAuthStore()
  const navigate = useNavigate()
  const [time, setTime] = useState(new Date())

  const { data: branch } = useQuery({
    queryKey: ['branches', user?.branchId],
    queryFn: () => user?.branchId ? branchApi.getById(user.branchId).then(r => r.data.data) : null,
    enabled: !!user?.branchId,
    staleTime: Infinity,
  })

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const handleLogout = async () => {
    try { await authApi.logout() } catch { /* ignore */ }
    clearAuth()
    toast.success('Berhasil keluar')
    navigate('/login', { replace: true })
  }

  const timeStr = time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const dateStr = time.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-stone-50">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 px-4 py-2 flex items-center gap-4 flex-shrink-0 shadow-sm">
        {/* Brand */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-sm">🍊</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-stone-800 truncate">
              {branch?.name ?? 'POS O-JERUK'}
            </p>
            <p className="text-[11px] text-stone-400 truncate">{user?.name}</p>
          </div>
        </div>

        {/* Clock */}
        <div className="flex-1 text-center hidden sm:block">
          <p className="text-base font-mono font-semibold text-stone-700">{timeStr}</p>
          <p className="text-[11px] text-stone-400">{dateStr}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 ml-auto">
          {onShowHistory && (
            <button onClick={onShowHistory}
              className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-sm text-stone-600 hover:bg-stone-100 transition-all">
              <ClipboardList size={15} /> Riwayat
            </button>
          )}
          {onShowHeld && (
            <button onClick={onShowHeld}
              className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-sm text-stone-600 hover:bg-stone-100 transition-all">
              <PauseCircle size={15} /> Hold
            </button>
          )}
          <button onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-sm text-stone-600 hover:bg-stone-100 transition-all">
            <LayoutDashboard size={15} /> Dashboard
          </button>
          <button onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-sm text-stone-500 hover:text-red-600 hover:bg-red-50 transition-all">
            <LogOut size={15} />
          </button>
        </div>
      </header>

      {/* Content area */}
      <div className="flex flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  )
}
