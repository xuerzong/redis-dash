export type RedisTypeVarKey =
  | 'hash'
  | 'set'
  | 'zset'
  | 'list'
  | 'string'
  | 'stream'
  | 'none'
  | 'default'

const REDIS_TYPE_VAR_KEYS = {
  HASH: 'hash',
  SET: 'set',
  ZSET: 'zset',
  LIST: 'list',
  STRING: 'string',
  STREAM: 'stream',
  NONE: 'none',
  DEFAULT: 'default',
} as Record<string, RedisTypeVarKey>

export const getRedisTypeVarKey = (type: string): RedisTypeVarKey => {
  if (!type) {
    return REDIS_TYPE_VAR_KEYS.DEFAULT
  }

  const upperType = type.toUpperCase()
  return REDIS_TYPE_VAR_KEYS[upperType] || REDIS_TYPE_VAR_KEYS.DEFAULT
}
