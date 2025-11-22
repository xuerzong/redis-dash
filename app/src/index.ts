import http from 'node:http'
import { useWebsocketServer } from './wsServer'
import { initDatabase } from './server/lib/db'
import {
  httpUploadFileHandler,
  httpStaticHandler,
  httpHtmlHanlder,
} from './server/handler'

const bootstrap = async () => {
  await initDatabase()
  const server = http.createServer(
    httpUploadFileHandler(httpStaticHandler(httpHtmlHanlder()))
  )
  useWebsocketServer(server)
  const port = parseInt(process.env.PORT || '5090')

  server.listen(port, () => {
    console.log(`🚀 The server is running at http://127.0.0.1:${port}`)
  })
  server.on('error', () => {
    process.exit(1)
  })
  process.on('SIGINT', () => {
    server.close(() => {
      process.exit(0)
    })
  })
}

bootstrap()
