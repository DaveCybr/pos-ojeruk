import { formatCurrency, formatDateTime } from './utils'
import type { Transaction } from '../features/pos/types'

export function buildReceiptHtml(tx: Transaction): string {
  const rows = tx.items?.map(item => `
    <div class="item-name">${item.product?.name ?? '-'}</div>
    <div class="row muted">
      <span>${item.quantity} &times; ${formatCurrency(item.price)}</span>
      <span>${formatCurrency(item.subtotal)}</span>
    </div>
  `).join('') ?? ''

  const discountRow = Number(tx.discount) > 0
    ? `<div class="row green"><span>Diskon</span><span>-${formatCurrency(tx.discount)}</span></div>`
    : ''

  const changeRow = Number(tx.changeAmount) > 0
    ? `<div class="row"><span>Kembalian</span><span>${formatCurrency(tx.changeAmount)}</span></div>`
    : ''

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <title>Struk ${tx.invoiceNo}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 12px;
      width: 300px;
      margin: 0 auto;
      padding: 12px 8px;
      color: #111;
    }
    .center { text-align: center; }
    .bold { font-weight: 700; }
    .muted { color: #555; }
    .green { color: #16a34a; }
    .divider { border-top: 1px dashed #aaa; margin: 6px 0; }
    .row { display: flex; justify-content: space-between; margin: 2px 0; }
    .item-name { font-weight: 600; margin-top: 4px; }
    .brand { font-size: 15px; font-weight: 700; }
    .total-row {
      display: flex;
      justify-content: space-between;
      font-size: 14px;
      font-weight: 700;
      border-top: 1px solid #333;
      padding-top: 4px;
      margin-top: 4px;
    }
    .footer { text-align: center; color: #888; font-size: 11px; margin-top: 8px; }
    @media print {
      @page { margin: 0mm 2mm; size: 80mm auto; }
      html, body { width: 80mm; margin: 0; padding: 2mm; }
    }
  </style>
</head>
<body>
  <div class="center brand">&#127818; POS O-JERUK</div>
  <div class="center muted">${tx.branch?.name ?? ''}</div>
  <div class="center muted" style="font-size:11px;">${formatDateTime(tx.createdAt)}</div>

  <div class="divider"></div>
  <div class="row"><span class="muted">Invoice</span><span class="bold">${tx.invoiceNo}</span></div>
  <div class="row"><span class="muted">Kasir</span><span>${tx.cashier?.name ?? ''}</span></div>

  <div class="divider"></div>
  ${rows}

  <div class="divider"></div>
  <div class="row muted"><span>Subtotal</span><span>${formatCurrency(tx.subtotal)}</span></div>
  ${discountRow}
  <div class="total-row"><span>Total</span><span>${formatCurrency(tx.total)}</span></div>
  <div class="row muted"><span>Dibayar (${tx.paymentMethod})</span><span>${formatCurrency(tx.paidAmount)}</span></div>
  ${changeRow}

  <div class="divider"></div>
  <div class="footer">Terima kasih sudah berbelanja! &#127818;</div>
</body>
</html>`
}

export function printReceipt(tx: Transaction) {
  const iframe = document.createElement('iframe')
  iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;border:none;'
  document.body.appendChild(iframe)

  const doc = iframe.contentDocument ?? iframe.contentWindow?.document
  if (!doc) { document.body.removeChild(iframe); return }

  doc.open()
  doc.write(buildReceiptHtml(tx))
  doc.close()

  iframe.contentWindow?.focus()
  setTimeout(() => {
    iframe.contentWindow?.print()
    // remove after browser has opened the print dialog
    setTimeout(() => document.body.removeChild(iframe), 1000)
  }, 300)
}
