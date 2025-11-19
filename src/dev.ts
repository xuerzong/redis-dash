import { createServer } from 'vite'
import path from 'node:path'
import fs from 'node:fs/promises'
const rootPath = process.cwd()
import http from 'node:http'
import { useWebsocketServer } from './server/lib/ws'
import { ok, serverError } from './server/lib/response'
import { initDatabase } from './server/lib/db'

const bootstrap = async () => {
  initDatabase()
  const port = parseInt(process.env.PORT || '5090')

  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
  })

  const server = http.createServer(async (req, res) => {
    vite.middlewares(req, res, async (err: any) => {
      if (err) {
        vite.config.logger.error(err)
        return serverError(res)
      }

      if (!res.writableEnded) {
        try {
          const originalUrl = req.url || ''
          const url = originalUrl === '' ? '/' : originalUrl
          const templatePath = path.resolve(rootPath, 'index.html')
          const template = await fs.readFile(templatePath, 'utf-8')
          const transformedTemplate = await vite.transformIndexHtml(
            url,
            template
          )
          return ok(res, transformedTemplate, { 'content-type': 'text/html' })
        } catch (e: any) {
          vite.config.logger.error(e)
          return serverError(res)
        }
      }
    })
  })

  useWebsocketServer(server)

  server.listen(port, () => {
    console.log(`🚀 The server is running at http://127.0.0.1:${port}`)
  })
}

bootstrap()
