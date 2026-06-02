import { AlertCircle, RefreshCw } from 'lucide-react'

interface ErrorStateProps {
  error?: unknown
  onRetry?: () => void
  message?: string
}

function extractMessage(error: unknown): string {
  if (typeof error === 'string') return error
  if (error && typeof error === 'object') {
    const e = error as { response?: { data?: { message?: string } }; message?: string }
    return e.response?.data?.message ?? e.message ?? 'Terjadi kesalahan'
  }
  return 'Terjadi kesalahan'
}

export function ErrorState({ error, onRetry, message }: ErrorStateProps) {
  const msg = message ?? extractMessage(error)
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mb-4">
        <AlertCircle size={28} className="text-red-400" />
      </div>
      <p className="text-base font-medium text-stone-700 mb-1">Gagal memuat data</p>
      <p className="text-sm text-stone-400 mb-5 max-w-xs">{msg}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 h-9 rounded-lg bg-orange-500 hover:bg-orange-600
            text-white text-sm font-medium transition-all"
        >
          <RefreshCw size={14} /> Coba Lagi
        </button>
      )}
    </div>
  )
}
