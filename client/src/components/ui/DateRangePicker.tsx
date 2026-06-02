interface DateRangePickerProps {
  startDate: string
  endDate: string
  onStartChange: (v: string) => void
  onEndChange: (v: string) => void
}

function toISO(d: Date) {
  return d.toISOString().slice(0, 10)
}

const presets = [
  {
    label: 'Hari ini',
    get() {
      const t = toISO(new Date()); return { start: t, end: t }
    },
  },
  {
    label: '7 Hari',
    get() {
      const end = new Date(); const start = new Date(end); start.setDate(start.getDate() - 6)
      return { start: toISO(start), end: toISO(end) }
    },
  },
  {
    label: '30 Hari',
    get() {
      const end = new Date(); const start = new Date(end); start.setDate(start.getDate() - 29)
      return { start: toISO(start), end: toISO(end) }
    },
  },
  {
    label: 'Bulan Ini',
    get() {
      const now = new Date()
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      return { start: toISO(start), end: toISO(now) }
    },
  },
]

export function DateRangePicker({ startDate, endDate, onStartChange, onEndChange }: DateRangePickerProps) {
  const apply = (preset: (typeof presets)[0]) => {
    const { start, end } = preset.get()
    onStartChange(start)
    onEndChange(end)
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {presets.map(p => {
        const { start, end } = p.get()
        const active = startDate === start && endDate === end
        return (
          <button
            key={p.label}
            onClick={() => apply(p)}
            className={`px-3 h-8 rounded-lg text-xs font-medium border transition-all ${
              active
                ? 'bg-orange-500 text-white border-orange-500'
                : 'bg-white text-stone-600 border-stone-200 hover:border-orange-300'
            }`}
          >
            {p.label}
          </button>
        )
      })}
      <div className="flex items-center gap-1.5">
        <input
          type="date"
          value={startDate}
          onChange={e => onStartChange(e.target.value)}
          className="h-8 border border-stone-200 rounded-lg text-sm px-2 bg-white focus:outline-none focus:border-orange-400"
        />
        <span className="text-stone-400 text-sm">—</span>
        <input
          type="date"
          value={endDate}
          onChange={e => onEndChange(e.target.value)}
          className="h-8 border border-stone-200 rounded-lg text-sm px-2 bg-white focus:outline-none focus:border-orange-400"
        />
      </div>
    </div>
  )
}
