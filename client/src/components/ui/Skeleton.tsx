function Pulse({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-stone-200 rounded-lg ${className ?? ''}`} />
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <Pulse className="w-10 h-10 rounded-xl" />
        <Pulse className="w-12 h-4" />
      </div>
      <Pulse className="w-24 h-3 mb-2" />
      <Pulse className="w-32 h-7" />
    </div>
  )
}

export function ChartSkeleton({ height = 'h-64' }: { height?: string }) {
  return <Pulse className={`w-full ${height} rounded-xl`} />
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm">
      {/* header */}
      <div className="flex gap-4 px-4 py-3 border-b border-stone-200 bg-stone-50">
        {Array.from({ length: cols }).map((_, i) => (
          <Pulse key={i} className="h-3 flex-1" />
        ))}
      </div>
      {/* rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 px-4 py-4 border-b border-stone-100 last:border-0">
          {Array.from({ length: cols }).map((_, c) => (
            <Pulse key={c} className={`h-3 flex-1 ${c === 0 ? 'max-w-[40%]' : ''}`} />
          ))}
        </div>
      ))}
    </div>
  )
}

export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-5">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-1.5">
          <Pulse className="w-24 h-3" />
          <Pulse className="w-full h-10" />
        </div>
      ))}
      <Pulse className="w-full h-10 mt-2" />
    </div>
  )
}
