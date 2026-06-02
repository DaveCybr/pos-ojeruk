import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { LayoutDashboard, ClipboardList, PauseCircle, LogOut, ChevronDown, Check, Clock, StopCircle } from 'lucide-react'
import { useAuthStore } from '../../stores/auth.store'
import { authApi } from '../../features/auth/api'
import { branchApi } from '../../features/branches/api'
import { useSocket } from '../../hooks/useSocket'
import { useStockSocket } from '../../hooks/useStockSocket'
import { useTransactionSocket } from '../../hooks/useTransactionSocket'
import toast from 'react-hot-toast'
import type { ActiveShift } from '../../features/pos/shiftApi'

interface POSLayoutProps {
  children: React.ReactNode
  activeBranchId?: string
  onBranchChange?: (id: string) => void
  activeShift?: ActiveShift | null
  onCloseShift?: () => void
  onShowHeld?: () => void
  onShowHistory?: () => void
}

interface Branch { id: string; name: string; isActive: boolean }

export function POSLayout({
  children, activeBranchId, onBranchChange, activeShift, onCloseShift, onShowHeld, onShowHistory,
}: POSLayoutProps) {
  const { user, clearAuth } = useAuthStore()
  const navigate = useNavigate()
  const [time, setTime] = useState(new Date())
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'WAREHOUSE'

  useSocket()
  useStockSocket()
  useTransactionSocket()

  const { data: cashierBranch } = useQuery({
    queryKey: ['branches', user?.branchId],
    queryFn:  () => user?.branchId ? branchApi.getById(user.branchId).then(r => r.data.data) : null,
    enabled:  !isAdmin && !!user?.branchId,
    staleTime: Infinity,
  })

  const { data: allBranches } = useQuery<Branch[]>({
    queryKey: ['branches'],
    queryFn:  () => branchApi.list().then(r => r.data.data.filter((b: Branch) => b.isActive)),
    enabled:  isAdmin,
    staleTime: 5 * 60 * 1000,
  })

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = async () => {
    try { await authApi.logout() } catch { /* ignore */ }
    clearAuth()
    toast.success('Berhasil keluar')
    navigate('/login', { replace: true })
  }

  const timeStr = time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const dateStr = time.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })

  const selectedBranchName = isAdmin
    ? allBranches?.find(b => b.id === activeBranchId)?.name
    : cashierBranch?.name

  // Shift duration display
  const shiftDuration = activeShift
    ? (() => {
        const diff = Math.floor((Date.now() - new Date(activeShift.openedAt).getTime()) / 60000)
        const h = Math.floor(diff / 60), m = diff % 60
        return h > 0 ? `${h}j ${m}m` : `${m}m`
      })()
    : null

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-stone-50">
      <header className="bg-white border-b border-stone-200 px-4 py-2 flex items-center gap-4 flex-shrink-0 shadow-sm">
        {/* Brand + Branch */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-sm">🍊</span>
          </div>
          <div className="min-w-0">
            {isAdmin && onBranchChange ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(v => !v)}
                  className="flex items-center gap-1 text-sm font-semibold text-stone-800 hover:text-orange-600 transition-colors"
                >
                  <span className="max-w-[160px] truncate">
                    {selectedBranchName ?? '— Pilih cabang —'}
                  </span>
                  <ChevronDown size={13} className={`flex-shrink-0 text-stone-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {dropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-52 bg-white border border-stone-200 rounded-xl shadow-lg z-50 py-1 overflow-hidden">
                    {allBranches?.map(b => (
                      <button key={b.id} onClick={() => { onBranchChange(b.id); setDropdownOpen(false) }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-colors ${
                          b.id === activeBranchId ? 'bg-orange-50 text-orange-600 font-medium' : 'text-stone-700 hover:bg-stone-50'
                        }`}>
                        {b.name}
                        {b.id === activeBranchId && <Check size={13} />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm font-semibold text-stone-800 truncate">
                {selectedBranchName ?? 'POS O-JERUK'}
              </p>
            )}
            <p className="text-[11px] text-stone-400 truncate">{user?.name}</p>
          </div>
        </div>

        {/* Shift status badge (cashier) */}
        {activeShift && shiftDuration && (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 border border-green-200">
            <Clock size={12} className="text-green-600" />
            <span className="text-[11px] font-medium text-green-700">Shift {shiftDuration}</span>
          </div>
        )}

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
          {onCloseShift && (
            <button onClick={onCloseShift}
              className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-sm text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-all">
              <StopCircle size={15} /> Tutup Shift
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

      <div className="flex flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  )
}
