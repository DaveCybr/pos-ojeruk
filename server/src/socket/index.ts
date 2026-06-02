import { Server as SocketServer } from 'socket.io'
import { Server as HttpServer } from 'http'

let io: SocketServer

export const initSocket = (server: HttpServer) => {
  io = new SocketServer(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  })

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`)

    socket.on('join:branch', (branchId: string) => {
      socket.join(`branch:${branchId}`)
      console.log(`Socket ${socket.id} joined branch:${branchId}`)
    })

    socket.on('join:warehouse', () => {
      socket.join('warehouse')
      console.log(`Socket ${socket.id} joined warehouse`)
    })

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`)
    })
  })

  return io
}

export const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized')
  return io
}

export const emitToWarehouse = (event: string, data: unknown) => {
  getIO().to('warehouse').emit(event, data)
}

export const emitToBranch = (branchId: string, event: string, data: unknown) => {
  getIO().to(`branch:${branchId}`).emit(event, data)
}

export const emitToAll = (branchId: string, event: string, data: unknown) => {
  emitToBranch(branchId, event, data)
  emitToWarehouse(event, data)
}
