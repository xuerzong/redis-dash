export const redisKeyTypes = [
  'STRING',
  'HASH',
  'ZSET',
  'SET',
  'STREAM',
  'LIST',
] as const

export type RedisKeyType = (typeof redisKeyTypes)[number]
