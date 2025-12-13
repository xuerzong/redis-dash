import { Server as HttpServer } from 'node:http'
import { WebSocketServer } from 'ws'
import { Server as HTTPSServer } from 'https'
import picocolors from 'picocolors'
import logger from '@server/lib/logger'
import redisMap from '@server/lib/redisMap'
import { connectionDb } from '@server/lib/db'
import { apiRouter } from '@server/router'
import { __DEV__ } from '@server/utils/env'
import eventEmitter from '@server/lib/eventEmitter'
import { REDIS_MESSAGE_EVENT } from '@server/constants/events'
import type { RedisRole } from './types'

const { bgGreen, white } = picocolors

const onWebsockerEvent = async ({
  type,
  data,
  requestId,
}: {
  type: string
  data: any
  requestId: string
  role: RedisRole
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
      const { id, command, args, role = 'publisher' } = data
      const connection = await connectionDb.find(id)
      if (!connection) {
        return
      }
      const redisInstance = await redisMap.getInstance(connection, role)
      if (command.toUpperCase() === 'PSUBSCRIBE') {
        redisInstance.psubscribe(args[0])
        break
      }
      if (command.toUpperCase() === 'PUNSUBSCRIBE') {
        redisInstance.punsubscribe(args[0])
        break
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
      if (__DEV__) {
        logger.log(
          bgGreen(white('====== Websocket Message ======')),
          '\n',
          JSON.stringify(JSON.parse(message.toString()), null, 2)
        )
      }
      const { type, data, requestId, role } = JSON.parse(message.toString())
      try {
        const resp = await onWebsockerEvent({ type, data, requestId, role })
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

    eventEmitter.on(REDIS_MESSAGE_EVENT, (data: string) => {
      ws.send(data)
    })
  })
}
