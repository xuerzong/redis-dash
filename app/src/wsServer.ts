import { Server as HttpServer } from 'node:http'
import { WebSocketServer } from 'ws'
import { Server as HTTPSServer } from 'https'
import picocolors from 'picocolors'
import { logger } from '@/utils/logger'
import { redisMap } from '@/server/lib/redisMap'
import { connectionDb } from '@/server/lib/db'
import { apiRouter } from '@/server/router'

const { bgGreen, white } = picocolors

const onWebsockerEvent = async ({
  type,
  data,
  requestId,
}: {
  type: string
  data: any
  requestId: string
}) => {
  let response: any = null
  switch (type) {
    // The Api Request
    case 'sendRequest': {
      const { method, url, body } = data
      response = await apiRouter.route(method, url, body)
      break
    }

    // The Redis Command
    case 'sendCommand': {
      const { id, command, args } = data
      const connection = await connectionDb.find(id)
      if (!connection) {
        return
      }
      const redisInstance = await redisMap.getInstance(connection)
      const redisInstanceStatus = redisMap.getInstanceStatus(connection)

      // No Ready Yet
      if (redisInstanceStatus !== 1) {
        return
      }
      response = await redisInstance.call(command, ...args)
      break
    }
    default:
      break
  }
  return { type, data: response, requestId }
}

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
        const resp = await onWebsockerEvent({ type, data, requestId })
        ws.send(JSON.stringify(resp))
      } catch (e: any) {
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
