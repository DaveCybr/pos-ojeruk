import * as AlertDialog from '@radix-ui/react-alert-dialog'
import { AlertTriangle, Loader2 } from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  onConfirm: () => void
  loading?: boolean
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Hapus',
  onConfirm,
  loading = false,
}: ConfirmDialogProps) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-in fade-in-0" />
        <AlertDialog.Content
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50
            bg-white rounded-2xl shadow-lg border border-stone-200 p-6 w-full max-w-sm
            animate-in fade-in-0 zoom-in-95"
        >
          <div className="flex items-start gap-4 mb-4">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={20} className="text-red-500" />
            </div>
            <div>
              <AlertDialog.Title className="text-base font-semibold text-stone-900">
                {title}
              </AlertDialog.Title>
              <AlertDialog.Description className="text-sm text-stone-500 mt-1">
                {description}
              </AlertDialog.Description>
            </div>
          </div>

          <div className="flex gap-3 justify-end mt-6">
            <AlertDialog.Cancel asChild>
              <button
                className="px-4 h-9 rounded-lg border border-stone-200 text-sm text-stone-600
                  hover:bg-stone-50 transition-all disabled:opacity-50"
                disabled={loading}
              >
                Batal
              </button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <button
                onClick={onConfirm}
                disabled={loading}
                className="flex items-center gap-2 px-4 h-9 rounded-lg bg-red-500 hover:bg-red-600
                  text-white text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading && <Loader2 size={14} className="animate-spin" />}
                {confirmLabel}
              </button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
