import { useState } from 'react'
import { AppLayout } from '../../components/layout/AppLayout'
import { PageHeader } from '../../components/layout/PageHeader'
import { SalesReportTab } from './SalesReportTab'
import { ProfitReportTab } from './ProfitReportTab'
import { StockReportTab } from './StockReportTab'

const TABS = [
  { key: 'sales',  label: 'Penjualan' },
  { key: 'profit', label: 'Profit'    },
  { key: 'stock',  label: 'Stok'      },
] as const

type TabKey = (typeof TABS)[number]['key']

export function ReportsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('sales')

  return (
    <AppLayout>
      <PageHeader title="Laporan" description="Analitik penjualan, profit, dan kondisi stok" />

      <div className="p-6 md:p-8">
        {/* Tab Bar */}
        <div className="flex border-b border-stone-200 mb-6">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-3 text-sm font-medium transition-all border-b-2 -mb-px ${
                activeTab === tab.key
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'sales'  && <SalesReportTab />}
        {activeTab === 'profit' && <ProfitReportTab />}
        {activeTab === 'stock'  && <StockReportTab />}
      </div>
    </AppLayout>
  )
}
