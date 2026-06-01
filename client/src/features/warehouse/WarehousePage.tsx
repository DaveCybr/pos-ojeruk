import { useState } from 'react'
import { Plus } from 'lucide-react'
import { AppLayout } from '../../components/layout/AppLayout'
import { PageHeader } from '../../components/layout/PageHeader'
import { RestockRequestsPage } from './RestockRequestsPage'
import { StockPage } from '../stock/StockPage'
import { RestockRequestModal } from './RestockRequestModal'
import { useAuthStore } from '../../stores/auth.store'

type Tab = 'restock' | 'stock'

export function WarehousePage() {
  const { user } = useAuthStore()
  const isCashier = user?.role === 'CASHIER'
  const [tab, setTab] = useState<Tab>('restock')
  const [modalOpen, setModalOpen] = useState(false)

  const tabs: { value: Tab; label: string }[] = isCashier
    ? [{ value: 'restock', label: 'Permintaan Restok' }]
    : [
        { value: 'restock', label: 'Permintaan Restok' },
        { value: 'stock',   label: 'Monitor Stok' },
      ]

  return (
    <AppLayout>
      <PageHeader
        title="Gudang"
        description="Manajemen restok dan monitoring stok semua cabang"
        action={
          isCashier ? (
            <button onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 px-4 h-10 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-all">
              <Plus size={16} /> Ajukan Restok
            </button>
          ) : undefined
        }
      />

      <div className="p-6 md:p-8">
        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-stone-100 rounded-xl p-1 w-fit">
          {tabs.map(t => (
            <button key={t.value} onClick={() => setTab(t.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t.value
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-500 hover:text-stone-700'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'restock' && <RestockRequestsPage embedded />}
        {tab === 'stock' && !isCashier && <StockPage noLayout />}
      </div>

      {isCashier && (
        <RestockRequestModal open={modalOpen} onClose={() => setModalOpen(false)} />
      )}
    </AppLayout>
  )
}
