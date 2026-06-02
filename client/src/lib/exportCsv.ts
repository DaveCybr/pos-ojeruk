export function exportCsv(
  headers: string[],
  rows: (string | number | null | undefined)[][],
  filename: string,
) {
  const escape = (v: string | number | null | undefined) =>
    `"${String(v ?? '').replace(/"/g, '""')}"`

  const csv = [headers.map(escape), ...rows.map(r => r.map(escape))]
    .map(r => r.join(','))
    .join('\r\n')

  // BOM for Excel UTF-8 recognition
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `${filename}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
