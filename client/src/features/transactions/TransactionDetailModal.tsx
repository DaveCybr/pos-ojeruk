import { Modal } from '../../components/ui/Modal'
import { formatCurrency, formatDateTime } from '../../lib/utils'
import type { Transaction } from './types'

interface Props {
  open: boolean
  onClose: () => void
  transaction: Transaction | null
}

const methodBadge: Record<string, string> = {
  CASH:     'bg-stone-100 text-stone-600 border-stone-200',
  TRANSFER: 'bg-sky-50 text-sky-700 border-sky-200',
  QRIS:     'bg-orange-50 text-orange-700 border-orange-200',
}

export function TransactionDetailModal({ open, onClose, transaction }: Props) {
  if (!transaction) return null

  return (
    <Modal open={open} onClose={onClose} title={transaction.invoiceNo} maxWidth="max-w-lg">
      <div className="space-y-4 text-sm">
        {/* Meta */}
        <div className="grid grid-cols-2 gap-2 bg-stone-50 rounded-xl p-4 border border-stone-100">
          <div><p className="text-[11px] text-stone-400 uppercase tracking-wide">Cabang</p><p className="font-medium text-stone-800">{transaction.branch?.name}</p></div>
          <div><p className="text-[11px] text-stone-400 uppercase tracking-wide">Kasir</p><p className="font-medium text-stone-800">{transaction.cashier?.name}</p></div>
          <div><p className="text-[11px] text-stone-400 uppercase tracking-wide">Tanggal</p><p className="font-medium text-stone-800">{formatDateTime(transaction.createdAt)}</p></div>
          <div><p className="text-[11px] text-stone-400 uppercase tracking-wide">Metode</p>
            <span className={`text-[13px] font-medium px-2 py-0.5 rounded-full border ${methodBadge[transaction.paymentMethod]}`}>
              {transaction.paymentMethod}
            </span>
          </div>
          {transaction.customer && (
            <div className="col-span-2"><p className="text-[11px] text-stone-400 uppercase tracking-wide">Pelanggan</p><p className="font-medium text-stone-800">{transaction.customer.name}</p></div>
          )}
        </div>

        {/* Items */}
        <div>
          <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wide mb-2">Item Pembelian</p>
          <div className="divide-y divide-stone-100 border border-stone-100 rounded-xl overflow-hidden">
            {transaction.items?.map(item => (
              <div key={item.id} className="flex justify-between items-center px-4 py-2.5">
                <div>
                  <p className="font-medium text-stone-800">{item.product?.name}</p>
                  <p className="text-[12px] text-stone-400">{item.quantity} × {formatCurrency(item.price)}</p>
                </div>
                <p className="font-semibold text-stone-800">{formatCurrency(item.subtotal)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="border-t border-stone-100 pt-3 space-y-1.5">
          <div className="flex justify-between text-stone-600"><span>Subtotal</span><span>{formatCurrency(transaction.subtotal)}</span></div>
          {Number(transaction.discount) > 0 && (
            <div className="flex justify-between text-green-600"><span>Diskon</span><span>-{formatCurrency(transaction.discount)}</span></div>
          )}
          <div className="flex justify-between font-bold text-stone-900 text-base"><span>Total</span><span>{formatCurrency(transaction.total)}</span></div>
          <div className="flex justify-between text-stone-500 text-xs"><span>Dibayar</span><span>{formatCurrency(transaction.paidAmount)}</span></div>
          {Number(transaction.changeAmount) > 0 && (
            <div className="flex justify-between text-stone-500 text-xs"><span>Kembalian</span><span>{formatCurrency(transaction.changeAmount)}</span></div>
          )}
        </div>
      </div>
    </Modal>
  )
}
