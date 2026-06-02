export const QK = {
  branches:    ['branches']    as const,
  users:       ['users']       as const,
  categories:  ['categories']  as const,
  products:    ['products']    as const,

  stock:           ['stock']               as const,
  stockBranch:     (id: string) => ['stock', 'branch', id]  as const,
  stockLow:        ['stock', 'low']        as const,
  stockMovements:  ['stock', 'movements']  as const,

  transactions:        ['transactions']              as const,
  transactionsBranch:  (id: string) => ['transactions', 'branch', id] as const,

  restockRequests: ['restock-requests'] as const,
  heldTx:         (branchId: string) => ['held-transactions', branchId] as const,

  reports: {
    summary: (branchId?: string) => ['reports', 'summary', branchId ?? ''] as const,
    sales:   (params: object)    => ['reports', 'sales',   params]         as const,
    profit:  (params: object)    => ['reports', 'profit',  params]         as const,
    stock:   (params: object)    => ['reports', 'stock',   params]         as const,
  },
}
