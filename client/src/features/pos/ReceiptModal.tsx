import { Printer, RotateCcw } from 'lucide-react'
import { Modal } from '../../components/ui/Modal'
import { formatCurrency, formatDateTime } from '../../lib/utils'
import { printReceipt } from '../../lib/receipt'
import type { Transaction } from './types'

interface ReceiptModalProps {
  open: boolean
  onClose: () => void
  transaction: Transaction | null
}

export function ReceiptModal({ open, onClose, transaction }: ReceiptModalProps) {
  if (!transaction) return null

  return (
    <Modal open={open} onClose={onClose} title="Transaksi Berhasil" maxWidth="max-w-sm">
      {/* Receipt preview */}
      <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 space-y-3 text-sm">
        {/* Header */}
        <div className="text-center border-b border-dashed border-stone-300 pb-3">
          <p className="text-base font-bold text-stone-900">🍊 POS O-JERUK</p>
          <p className="text-xs text-stone-500">{transaction.branch?.name}</p>
          <p className="text-xs text-stone-400 mt-1">{formatDateTime(transaction.createdAt)}</p>
        </div>

        {/* Invoice + cashier */}
        <div className="space-y-1 border-b border-dashed border-stone-300 pb-3">
          <div className="flex justify-between text-[13px]">
            <span className="text-stone-500">Invoice</span>
            <span className="font-mono font-semibold text-stone-800">{transaction.invoiceNo}</span>
          </div>
          <div className="flex justify-between text-[13px]">
            <span className="text-stone-500">Kasir</span>
            <span className="text-stone-700">{transaction.cashier?.name}</span>
          </div>
        </div>

        {/* Items */}
        <div className="space-y-2 border-b border-dashed border-stone-300 pb-3">
          {transaction.items?.map(item => (
            <div key={item.id} className="text-[13px]">
              <p className="text-stone-800 font-medium">{item.product?.name}</p>
              <div className="flex justify-between text-stone-500">
                <span>{item.quantity} × {formatCurrency(item.price)}</span>
                <span>{formatCurrency(item.subtotal)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="space-y-1">
          <div className="flex justify-between text-[13px] text-stone-600">
            <span>Subtotal</span>
            <span>{formatCurrency(transaction.subtotal)}</span>
          </div>
          {Number(transaction.discount) > 0 && (
            <div className="flex justify-between text-[13px] text-green-600">
              <span>Diskon</span>
              <span>-{formatCurrency(transaction.discount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-stone-900 text-base pt-1 border-t border-stone-200">
            <span>Total</span>
            <span>{formatCurrency(transaction.total)}</span>
          </div>
          <div className="flex justify-between text-[13px] text-stone-600">
            <span>Dibayar ({transaction.paymentMethod})</span>
            <span>{formatCurrency(transaction.paidAmount)}</span>
          </div>
          {Number(transaction.changeAmount) > 0 && (
            <div className="flex justify-between text-[13px] text-stone-600">
              <span>Kembalian</span>
              <span>{formatCurrency(transaction.changeAmount)}</span>
            </div>
          )}
        </div>

        <div className="text-center text-[11px] text-stone-400 border-t border-dashed border-stone-300 pt-3">
          Terima kasih sudah berbelanja! 🍊
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-4">
        <button onClick={() => printReceipt(transaction)}
          className="flex-1 flex items-center justify-center gap-2 h-10 border border-stone-200 rounded-lg text-sm text-stone-600 hover:bg-stone-50 transition-all">
          <Printer size={15} /> Cetak
        </button>
        <button onClick={onClose}
          className="flex-1 flex items-center justify-center gap-2 h-10 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-all">
          <RotateCcw size={15} /> Transaksi Baru
        </button>
      </div>
    </Modal>
  )
}
