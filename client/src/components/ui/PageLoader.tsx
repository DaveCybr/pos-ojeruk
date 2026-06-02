import { Loader2 } from 'lucide-react'

export function PageLoader() {
  return (
    <div className="fixed inset-0 bg-stone-50 flex flex-col items-center justify-center z-50">
      <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
        <span className="text-2xl">🍊</span>
      </div>
      <Loader2 className="w-6 h-6 animate-spin text-orange-400" />
    </div>
  )
}
