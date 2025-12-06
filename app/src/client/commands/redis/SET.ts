import { sendCommand } from '@xuerzong/redis-studio-invoke'

export interface SETData {
  member: string
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
