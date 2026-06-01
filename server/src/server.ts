import 'dotenv/config'
import http from 'http'
import app from './app'
import { initSocket } from './socket'

const PORT = process.env.PORT || 3000

const server = http.createServer(app)
initSocket(server)

server.listen(PORT, () => {
  console.log(`🍊 POS O-JERUK Server running on port ${PORT}`)
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`)
})
