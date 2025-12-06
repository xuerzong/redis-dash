import { sendCommand } from '@xuerzong/redis-studio-invoke'
import type { GetRedisStateParams } from '../redis'

export interface LISTData {
  index: number
  element: string
}

export const getLISTData = async (
  id: string,
  key: string,
  params: GetRedisStateParams
) => {
  const { pageNo = 1, pageSize = 100 } = params

  const start = Math.max(0, (pageNo - 1) * pageSize)
  const end = pageNo * pageSize - 1

  const data = await sendCommand<string[]>({
    id,
    command: 'LRANGE',
    args: [key, start, end],
  })

  return data.reduce((pre, cur, index) => {
    return [...pre, { element: cur, index: start + index }]
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
