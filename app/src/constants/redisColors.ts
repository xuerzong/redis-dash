export const REDIS_TYPE_COLORS = {
  HASH: '#FF9900',
  SET: '#00BFFF',
  ZSET: '#9933CC',
  LIST: '#33CC33',
  STRING: '#0077B6',
  STREAM: '#FF6347',

  NONE: '#AAAAAA',
  DEFAULT: '#555555',
} as Record<string, string>

export const getRedisTypeColor = (type: string) => {
  if (!type) {
    return REDIS_TYPE_COLORS.DEFAULT
  }
  const upperType = type.toUpperCase()
  return REDIS_TYPE_COLORS[upperType] || REDIS_TYPE_COLORS.DEFAULT
}
