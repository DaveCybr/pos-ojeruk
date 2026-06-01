import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000', {
      withCredentials: true,
      autoConnect: false,
    })
  }
  return socket
}

export const connectSocket = (role: string, branchId?: string) => {
  const s = getSocket()
  if (!s.connected) s.connect()
  if (role === 'CASHIER' && branchId) {
    s.emit('join:branch', branchId)
  } else if (role === 'WAREHOUSE' || role === 'ADMIN') {
    s.emit('join:warehouse')
  }
}

export const disconnectSocket = () => {
  socket?.disconnect()
  socket = null
}
