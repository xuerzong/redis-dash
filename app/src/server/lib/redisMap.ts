import Redis, { type RedisOptions } from 'ioredis'
import { safeReadFile } from '@/utils/fs'
import type { ConnectionData } from './db/connections'

type RedisConfig = ConnectionData

export class RedisMap {
  instances: Map<string, Redis>
  instancesStatus: Map<string, number>

  static getKey(config: RedisConfig) {
    return `${config.host}_${config.port}_${config.username}_${config.password}`
  }

  constructor() {
    this.instances = new Map()
    this.instancesStatus = new Map()
  }

  async getInstance(config: RedisConfig) {
    const key = RedisMap.getKey(config)
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

    redis.on('error', () => {
      this.instancesStatus.set(key, -1)
    })

    redis.on('connect', () => {
      this.instancesStatus.set(key, 1)
    })

    redis.on('close', () => {
      this.instancesStatus.delete(key)
      this.instances.delete(key)
    })

    redis.on('end', () => {
      this.instancesStatus.delete(key)
      this.instances.delete(key)
    })

    this.instances.set(key, redis)

    return redis
  }

  getInstanceStatus(config: RedisConfig) {
    const key = RedisMap.getKey(config)
    return this.instancesStatus.get(key) || 0
  }

  async closeInstance(config: RedisConfig) {
    const key = RedisMap.getKey(config)
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

export const redisMap = new RedisMap()
