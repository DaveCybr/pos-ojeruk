import { Sidebar } from './Sidebar'
import { useSocket } from '../../hooks/useSocket'
import { useStockSocket } from '../../hooks/useStockSocket'
import { useTransactionSocket } from '../../hooks/useTransactionSocket'

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  useSocket()
  useStockSocket()
  useTransactionSocket()

  return (
    <div className="flex h-screen bg-stone-50 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
