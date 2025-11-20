import Redis from 'ioredis'
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

  getInstance(config: RedisConfig) {
    const key = RedisMap.getKey(config)
    if (this.instances.has(key)) {
      return this.instances.get(key)!
    }

    const redis = new Redis({
      ...config,
      port: Number(config.port),
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
