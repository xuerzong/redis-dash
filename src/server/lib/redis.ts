import Redis from 'ioredis'

interface RedisConfig {
  host: string
  port: number
  password: string
  username: string
}

export class RedisMap {
  instances: Map<string, Redis>

  static getKey(config: RedisConfig) {
    return `${config.host}_${config.port}_${config.username}_${config.password}`
  }

  static parseRedisInfo(infoString: string) {
    const result = {}
    let currentSection = null

    const lines = infoString.split('\n').filter((line) => line.trim() !== '')

    for (const line of lines) {
      if (line.startsWith('#')) {
        currentSection = line.replace('# ', '').trim().toLowerCase()
        result[currentSection] = {}
      } else if (currentSection) {
        const colonIndex = line.indexOf(':')
        if (colonIndex !== -1) {
          const key = line.substring(0, colonIndex).trim()
          const value = line.substring(colonIndex + 1).trim()
          result[currentSection][key] = isNaN(Number(value))
            ? value
            : Number(value)
        }
      }
    }

    console.log(result)

    return result
  }

  constructor() {
    this.instances = new Map()
  }

  getInstance(config: RedisConfig) {
    const key = RedisMap.getKey(config)
    if (this.instances.has(key)) {
      return this.instances.get(key)!
    }

    const redis = new Redis(config)

    redis.on('close', () => {
      this.instances.delete(key)
    })

    this.instances.set(key, redis)

    return redis
  }

  async closeInstance(config: RedisConfig) {
    const key = RedisMap.getKey(config)
    const redis = this.instances.get(key)

    if (redis) {
      try {
        await redis.quit()
      } catch {
        redis.disconnect()
      }
    }
  }
}

export const redisMap = new RedisMap()
