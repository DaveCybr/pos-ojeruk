import { useQuery } from '@tanstack/react-query'
import { Loader2, Phone, Calendar, Pencil } from 'lucide-react'
import { Modal } from '../../components/ui/Modal'
import { customerApi } from './api'
import { formatCurrency, formatDateTime } from '../../lib/utils'
import { printReceipt } from '../../lib/receipt'
import { useAuthStore } from '../../stores/auth.store'
import type { CustomerListItem } from './types'
import type { Transaction } from '../pos/types'

interface Props {
  open: boolean
  onClose: () => void
  customerId: string | null
  onEdit?: (c: CustomerListItem) => void
}

const statusBadge: Record<string, string> = {
  COMPLETED: 'bg-green-50 text-green-700 border-green-200',
  VOIDED:    'bg-red-50 text-red-700 border-red-200',
  HELD:      'bg-amber-50 text-amber-700 border-amber-200',
}
const methodBadge: Record<string, string> = {
  CASH:     'bg-stone-100 text-stone-600 border-stone-200',
  TRANSFER: 'bg-sky-50 text-sky-700 border-sky-200',
  QRIS:     'bg-orange-50 text-orange-700 border-orange-200',
}

export function CustomerDetailModal({ open, onClose, customerId, onEdit }: Props) {
  const { user } = useAuthStore()

  const { data, isLoading } = useQuery({
    queryKey: ['customers', customerId],
    queryFn:  () => customerApi.getById(customerId!).then(r => r.data.data),
    enabled:  open && !!customerId,
  })

  const initials = (name: string) => name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

  return (
    <Modal open={open} onClose={onClose} title="Detail Pelanggan" maxWidth="max-w-2xl">
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 animate-spin text-orange-400" />
        </div>
      ) : data ? (
        <div className="space-y-5">
          {/* Customer info */}
          <div className="flex items-start gap-4 bg-stone-50 rounded-xl p-4 border border-stone-100">
            <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-base">{initials(data.name)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-lg font-semibold text-stone-900">{data.name}</p>
                {user?.role === 'ADMIN' && onEdit && (
                  <button
                    onClick={() => onEdit({ id: data.id, name: data.name, phone: data.phone, createdAt: data.createdAt, transactionCount: data.transactions.length, totalBelanja: data.totalBelanja })}
                    className="flex items-center gap-1.5 px-3 h-8 rounded-lg border border-stone-200 text-sm text-stone-600 hover:bg-stone-100 transition-all">
                    <Pencil size={13} /> Edit
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-4 mt-1">
                {data.phone && (
                  <span className="flex items-center gap-1 text-sm text-stone-500">
                    <Phone size={13} /> {data.phone}
                  </span>
                )}
                <span className="flex items-center gap-1 text-sm text-stone-500">
                  <Calendar size={13} /> Bergabung {formatDateTime(data.createdAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-xl border border-stone-200 p-4">
              <p className="text-xs text-stone-400 mb-1">Total Transaksi</p>
              <p className="text-2xl font-bold text-stone-900">{data.transactions.length}</p>
            </div>
            <div className="bg-white rounded-xl border border-stone-200 p-4">
              <p className="text-xs text-stone-400 mb-1">Total Belanja</p>
              <p className="text-2xl font-bold text-orange-600">{formatCurrency(data.totalBelanja)}</p>
            </div>
          </div>

          {/* Transaction history */}
          <div>
            <p className="text-sm font-semibold text-stone-700 mb-2">Riwayat Transaksi</p>
            {data.transactions.length === 0 ? (
              <div className="text-center py-8 text-stone-400 text-sm">Belum ada transaksi</div>
            ) : (
              <div className="border border-stone-200 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-stone-50 border-b border-stone-200 sticky top-0">
                    <tr>
                      {['Invoice', 'Tanggal', 'Total', 'Metode', 'Status', ''].map(h => (
                        <th key={h} className="px-3 py-2.5 text-left text-[11px] font-semibold text-stone-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.transactions.map((tx: Transaction) => (
                      <tr key={tx.id} className="border-b border-stone-100 hover:bg-stone-50/50 transition-colors">
                        <td className="px-3 py-2.5 font-mono text-[13px] text-stone-700">{tx.invoiceNo}</td>
                        <td className="px-3 py-2.5 text-stone-500 text-xs whitespace-nowrap">{formatDateTime(tx.createdAt)}</td>
                        <td className="px-3 py-2.5 font-semibold text-stone-800">{formatCurrency(tx.total)}</td>
                        <td className="px-3 py-2.5">
                          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${methodBadge[tx.paymentMethod]}`}>
                            {tx.paymentMethod}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${statusBadge[tx.status]}`}>
                            {tx.status}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          {tx.status === 'COMPLETED' && (
                            <button onClick={() => printReceipt(tx)}
                              className="text-xs text-orange-600 hover:text-orange-700 font-medium">
                              Struk
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </Modal>
  )
}
