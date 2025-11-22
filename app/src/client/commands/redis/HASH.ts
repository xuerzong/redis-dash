import { sendCommand } from '@/client/utils/invoke'

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
