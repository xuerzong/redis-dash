import { sendCommand } from '@/client/utils/invoke'

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
