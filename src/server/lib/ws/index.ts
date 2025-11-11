import { Server as HttpServer } from 'node:http'
import { WebSocketServer } from 'ws'
import { Server as HTTPSServer } from 'https'
import picocolors from 'picocolors'
import connectionDb from '@/server/lib/db/connections'
import { Events } from '@/constants/event'
import { logger } from '@/server/log'
import { redisMap } from '../redis'

const { bgGreen, white } = picocolors

export const useWebsocketServer = (server: HttpServer | HTTPSServer) => {
  const wss = new WebSocketServer({ server })
  wss.on('connection', (ws) => {
    logger.log('Websocket connect successfully')
    ws.on('message', async (message) => {
      logger.log(
        bgGreen(white('====== Websocket Message ======')),
        '\n',
        JSON.stringify(JSON.parse(message.toString()), null, 2)
      )
      const { type, data, requestId } = JSON.parse(message.toString())
      try {
        let respData: any = null
        switch (type) {
          case Events.init:
            respData = true
            break

          case Events.sendRequest: {
            const { method, url, body } = data
            let response: any = null
            switch (url) {
              case '/api/connections':
                response = await connectionDb.findMany()
                break
              case '/api/connection': {
                if (method === 'POST') {
                  response = await connectionDb.insert(body)
                }

                if (method === 'PUT') {
                  const { id, ...restBody } = body
                  response = await connectionDb.update(id, restBody)
                }

                if (method === 'DELETE') {
                  const { id } = body
                  response = await connectionDb.del(id)
                }
                break
              }
            }
            respData = response
            break
          }

          case Events.sendCommand: {
            const { id, command, args } = data
            const config = await connectionDb.find(id)
            if (!config) {
              return
            }
            const redisInstance = redisMap.getInstance({
              host: config.host,
              password: config.password,
              username: config.username,
              port: Number(config.port),
            })

            respData = await redisInstance.call(command, ...args)

            break
          }
          default:
            break
        }
        ws.send(JSON.stringify({ type, data: respData, requestId }))
      } catch (e) {
        logger.error(e)
        ws.send(
          JSON.stringify({
            code: -1,
            data: e.message || 'Unknown Error',
            type,
            requestId,
          })
        )
      }
    })

    ws.on('close', () => {
      logger.log('Websocket Close')
    })

    ws.on('error', () => {
      logger.error('Websocket Error')
    })
  })
}
