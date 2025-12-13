import Redis, { type RedisOptions } from 'ioredis'
import { safeReadFile } from '@server/utils/fs'
import { __DEV__ } from '@server/utils/env'
import type { ConnectionData } from './db/connections'
import type { RedisRole } from '@/types'
import eventEmitter from '@server/lib/eventEmitter'
import { REDIS_MESSAGE_EVENT } from '@server/constants/events'
import { WebSocketMessage } from '@server/lib/message'
import logger from './logger'

declare global {
  var redisMap: RedisMap
}

type RedisConfig = ConnectionData

export class RedisMap {
  instances: Map<string, Redis>

  static getKey(config: RedisConfig, role: RedisRole = 'publisher') {
    return `${config.host}_${config.port}_${config.username}_${config.password}:${role}`
  }

  constructor() {
    this.instances = new Map()
  }

  async getInstance(config: RedisConfig, role: RedisRole = 'publisher') {
    const key = RedisMap.getKey(config, role)
    if (this.instances.has(key)) {
      return this.instances.get(key)!
    }

    const tlsParams: RedisOptions['tls'] = {}

    const tlsCa = await safeReadFile(config.ca)
    const tlsKey = await safeReadFile(config.key)
    const tlsCert = await safeReadFile(config.cert)

    if (tlsCa) {
      tlsParams.ca = tlsCa
    }
    if (tlsKey) {
      tlsParams.key = tlsKey
    }
    if (tlsCert) {
      tlsParams.cert = tlsCert
    }

    const enableTls = Object.keys(tlsParams).length > 0

    const redis = new Redis({
      ...config,
      port: Number(config.port),
      ...(enableTls ? { tls: tlsParams } : {}),
    })

    redis.on('error', (error) => {
      logger.error(error)
      this.instances.delete(key)
    })

    redis.on('close', () => {
      this.instances.delete(key)
    })

    redis.on('pmessage', (pattern, channel, message) => {
      eventEmitter.emit(
        REDIS_MESSAGE_EVENT,
        new WebSocketMessage({
          requestId: 'RedisPubSubRequestId',
          data: JSON.stringify({ pattern, channel, message }),
          type: 'onRedisMessage',
        }).toString()
      )
    })

    this.instances.set(key, redis)

    return redis
  }

  async closeInstance(config: RedisConfig, role: RedisRole = 'publisher') {
    const key = RedisMap.getKey(config, role)
    const redisInstance = this.instances.get(key)

    if (redisInstance) {
      try {
        await redisInstance.quit()
      } catch {
        redisInstance.disconnect()
      }
    }
  }
}

const createRedisMap = () => {
  return new RedisMap()
}

const redisMap = global.redisMap || createRedisMap()

if (__DEV__) {
  global.redisMap = redisMap
}

export default redisMap
