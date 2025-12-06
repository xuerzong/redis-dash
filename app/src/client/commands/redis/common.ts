import { sendCommand } from '@xuerzong/redis-studio-invoke'
import type { RedisKeyType } from '@/client/constants/redisKeyTypes'

export const getTTL = async (id: string, key: string) => {
  return sendCommand<number>({
    id,
    command: 'TTL',
    args: [key],
  })
}

export const getKeyType = async (id: string, key: string) => {
  const type = await sendCommand<string>({
    id,
    command: 'TYPE',
    args: [key],
  })
  return type.toUpperCase()
}

export const getKeys = async (
  id: string,
  opts: { match?: string; count?: number }
) => {
  const [_cursor, keys] = await sendCommand<[string, string[]]>({
    id,
    command: 'SCAN',
    args: ['0', 'MATCH', opts.match || '*', 'COUNT', opts.count || 100],
  })

  const keysWithType: {
    key: string
    type: RedisKeyType
  }[] = []

  for (const key of keys.map((key) => ({ key, type: 'UNSET' }))) {
    const keyType = await getKeyType(id, key.key)
    keysWithType.push({ ...key, type: keyType as RedisKeyType })
  }

  return keysWithType
}

export const delKey = (id: string, key: string) => {
  return sendCommand({
    id,
    command: 'DEL',
    args: [key],
  })
}

export const checkStatus = (id: string) => {
  return sendCommand({
    id,
    command: 'PING',
    args: [],
  })
}
