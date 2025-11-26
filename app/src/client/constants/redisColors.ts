import type { ColorPalette } from './colorPalettes'

export const REDIS_TYPE_COLORS = {
  HASH: 'amber',
  SET: 'blue',
  ZSET: 'purple',
  LIST: 'pink',
  STRING: 'green',
  STREAM: 'red',
  NONE: 'green',
  DEFAULT: 'lime',
} as Record<string, ColorPalette>

export const getRedisTypeColor = (type: string) => {
  if (!type) {
    return REDIS_TYPE_COLORS.DEFAULT
  }
  const upperType = type.toUpperCase()
  return REDIS_TYPE_COLORS[upperType] || REDIS_TYPE_COLORS.DEFAULT
}
