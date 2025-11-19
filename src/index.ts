import path from 'node:path'
import fs from 'node:fs/promises'
import http from 'node:http'
import { useWebsocketServer } from './server/lib/ws'
import { ok, serverError } from './server/lib/response'
import { dirname } from './utils/dirname'
import { initDatabase } from './server/lib/db'

const clientDistDir = path.resolve(dirname, 'client')
const assetsDir = path.resolve(clientDistDir, 'assets')
type HandlerFunc = (
  req: http.IncomingMessage,
  res: http.ServerResponse<http.IncomingMessage> & {
    req: http.IncomingMessage
  },
  next?: HandlerFunc
) => Promise<any>

type WithHandlerFunc = (next?: HandlerFunc) => HandlerFunc

const withStaticHandler: WithHandlerFunc =
  (next?: HandlerFunc) => async (req, res) => {
    if (!req.url?.startsWith('/assets/')) {
      return next?.(req, res)
    }

    const relativePath = req.url.slice('/assets/'.length)
    const filePath = path.resolve(assetsDir, relativePath)

    try {
      const stats = await fs.stat(filePath)
      if (!stats.isFile() || !filePath.startsWith(assetsDir)) {
        return next?.(req, res)
      }
    } catch {
      return next?.(req, res)
    }

    try {
      const content = await fs.readFile(filePath)
      const ext = path.extname(filePath).toLowerCase()
      const contentTypeMap: {
        [key: string]: string
      } = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
      }
      const contentType = contentTypeMap[ext] || 'application/octet-stream'
      return ok(res, content, { 'content-type': contentType })
    } catch (err) {
      console.error('Static Server Error:', err)
      return next?.(req, res)
    }
  }

const withHtmlHanlder: WithHandlerFunc = () => async (_req, res, _next) => {
  try {
    const htmlPath = path.resolve(clientDistDir, 'index.html')
    await fs.access(htmlPath)

    const template = await fs.readFile(htmlPath, 'utf-8')
    const html = template

    return ok(res, html, { 'content-type': 'text/html' })
  } catch (err) {
    console.error(err)
    return serverError(res)
  }
}

const bootstrap = async () => {
  initDatabase()
  const server = http.createServer(withStaticHandler(withHtmlHanlder()))
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
