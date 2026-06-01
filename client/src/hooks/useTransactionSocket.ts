import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getSocket } from '../lib/socket'
import { useAuthStore } from '../stores/auth.store'

export function useTransactionSocket() {
  const qc = useQueryClient()
  const { user } = useAuthStore()

  useEffect(() => {
    if (!user) return
    const socket = getSocket()

    socket.on('transaction:new', () => {
      qc.invalidateQueries({ queryKey: ['transactions'] })
      qc.invalidateQueries({ queryKey: ['stock'] })
    })

    return () => {
      socket.off('transaction:new')
    }
  }, [user, qc])
}
