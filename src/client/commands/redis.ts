import type { RedisKeyType } from '@/constants/redisKeyTypes'
import { sendCommand } from '../utils/invoke'
import { getSTREAMData, getSTREAMLen } from './redis/STREAM'

export const getTTL = (id: string, key: string) => {
  return sendCommand<number>({
    id,
    command: 'TTL',
    args: [key],
  })
}

export const getRedisState = async (id: string, key: string) => {
  const nextValueState: {
    keyName: string
    ttl: number
    type: RedisKeyType | 'UNSET'
    value: any
  } = {
    keyName: '',
    ttl: -1,
    type: 'UNSET',
    value: '',
  }

  nextValueState.keyName = key

  const ttl = await getTTL(id, key)
  nextValueState.ttl = ttl

  const type = await getKeyType(id, key)
  nextValueState.type = type.toUpperCase() as RedisKeyType

  switch (type.toUpperCase()) {
    case 'HASH': {
      nextValueState.value = {
        data: await getHASHData(id, key),
        length: await getHASHLen(id, key),
      }
      break
    }

    case 'STREAM': {
      nextValueState.value = {
        data: await getSTREAMData(id, key),
        lenght: await getSTREAMLen(id, key),
      }
      break
    }

    case 'SET': {
      nextValueState.value = {
        data: await getSETData(id, key),
        length: await getSETLen(id, key),
      }
      break
    }

    case 'ZSET': {
      nextValueState.value = {
        data: await getZSETData(id, key),
        length: await getZSETLen(id, key),
      }
      break
    }

    case 'LIST': {
      nextValueState.value = {
        data: await getLISTData(id, key),
        length: await getLISTLen(id, key),
      }
      break
    }

    default:
      nextValueState.value = await getSTRINGData(id, key)
      break
  }
  return nextValueState
}

export const getKeyType = async (id: string, key: string) => {
  const type = await sendCommand<string>({
    id,
    command: 'TYPE',
    args: [key],
  })
  return type.toUpperCase()
}

export const getSTRINGData = (id: string, key: string) => {
  return sendCommand<string>({
    id,
    command: 'GET',
    args: [key],
  })
}

export const setSTRINGData = (
  id: string,
  key: string,
  value: string,
  ttl: number = 0
) => {
  return sendCommand({
    id: id,
    command: 'SET',
    args: [key, value, ...(ttl > 0 ? ['EX', ttl] : [])],
  })
}

// HASH

interface HASHData {
  field: string
  value: string
}

export const getHASHData = async (id: string, key: string) => {
  const data = await sendCommand<string[]>({
    id,
    command: 'HGETALL',
    args: [key],
  })

  const entries: HASHData[] = []
  for (let i = 0; i < data.length; i += 2) {
    const field = data[i]
    const fieldValue = data[i + 1]
    entries.push({
      field,
      value: fieldValue,
    })
  }
  return entries
}

export const getHASHLen = (id: string, key: string) => {
  return sendCommand<string[]>({
    id,
    command: 'HLEN',
    args: [key],
  })
}

export const setHASHData = async (
  id: string,
  key: string,
  value: HASHData[]
) => {
  return sendCommand({
    id,
    command: 'HSET',
    args: [key, ...value.map((d) => [d.field, d.value]).flat()],
  })
}

export const delHASHData = async (id: string, key: string, value: HASHData) => {
  return sendCommand({
    id,
    command: 'HDEL',
    args: [key, value.field],
  })
}

// LIST

interface LISTData {
  index: number
  element: string
}

export const getLISTData = async (id: string, key: string) => {
  const data = await sendCommand<string[]>({
    id,
    command: 'LRANGE',
    args: [key, 0, -1],
  })

  return data.reduce((pre, cur, index) => {
    return [...pre, { element: cur, index }]
  }, [] as LISTData[])
}

export const getLISTLen = (id: string, key: string) => {
  return sendCommand<[string[]]>({
    id,
    command: 'LLEN',
    args: [key],
  })
}

export const setLISTData = (id: string, key: string, values: LISTData[]) => {
  return sendCommand<[string[]]>({
    id,
    command: 'RPUSH',
    args: [key, ...values.map((d) => d.element)],
  })
}

export const updateLISTData = (
  id: string,
  key: string,
  value: { element: string; index: number }
) => {
  return sendCommand({
    id,
    command: 'LSET',
    args: [key, value.index, value.element],
  })
}

export const delLISTData = async (
  id: string,
  key: string,
  value: { index: number; element: string }
) => {
  await sendCommand({
    id,
    command: 'LSET',
    args: [key, value.index, '__SHOULD_DEL_KEY__'],
  })

  await sendCommand({
    id,
    command: 'LREM',
    args: [key, 1, '__SHOULD_DEL_KEY__'],
  })
}

// SET

interface SETData {
  member?: string
}

export const getSETData = async (id: string, key: string) => {
  const data = await sendCommand<string[]>({
    id,
    command: 'SMEMBERS',
    args: [key],
  })
  return data.reduce((pre, cur) => {
    return [...pre, { member: cur }]
  }, [] as SETData[])
}

export const getSETLen = (id: string, key: string) => {
  return sendCommand<number>({
    id,
    command: 'SCARD',
    args: [key],
  })
}

export const setSETData = (id: string, key: string, values: SETData[]) => {
  return sendCommand({
    id,
    command: 'SADD',
    args: [key, ...values.map((d) => d.member)],
  })
}

// ZSET

interface ZSETData {
  score: number | string
  member: string
}

export const getZSETData = async (id: string, key: string) => {
  const data = await sendCommand({
    id,
    command: 'ZRANGE',
    args: [key, 0, -1, 'WITHSCORES'],
  })
  const entries: ZSETData[] = []
  for (let i = 0; i < data.length; i += 2) {
    const member = data[i]
    const score = data[i + 1]
    entries.push({
      member,
      score,
    })
  }
  return entries
}

export const getZSETLen = (id: string, key: string) => {
  return sendCommand<number>({
    id,
    command: 'ZCARD',
    args: [key],
  })
}

export const delSETData = async (
  id: string,
  key: string,
  values: {
    member: string
  }
) => {
  return sendCommand({
    id,
    command: 'SREM',
    args: [key, values.member],
  })
}

export const setZSETData = (id: string, key: string, values: ZSETData[]) => {
  return sendCommand({
    id,
    command: 'ZADD',
    args: [key, ...values.map((d) => [d.score, d.member]).flat()],
  })
}

export const delZSETData = (id: string, key: string, value: ZSETData) => {
  return sendCommand({
    id,
    command: 'ZREM',
    args: [key, value.member],
  })
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
