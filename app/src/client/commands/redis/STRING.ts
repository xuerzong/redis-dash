import { sendCommand } from '@/client/utils/invoke'

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
