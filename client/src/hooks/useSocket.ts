import { useEffect } from 'react'
import { useAuthStore } from '../stores/auth.store'
import { getSocket, connectSocket, disconnectSocket } from '../lib/socket'

export function useSocket() {
  const { user, isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated || !user) return

    connectSocket(user.role, user.branchId ?? undefined)

    return () => {
      disconnectSocket()
    }
  }, [isAuthenticated, user])

  return getSocket
}
