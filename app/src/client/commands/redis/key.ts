import { sendCommand } from '@xuerzong/redis-studio-invoke'

export const renameKey = (id: string, key: string, newKey: string) => {
  return sendCommand({
    id,
    command: 'RENAME',
    args: [key, newKey],
  })
}

export const expireKey = (
  id: string,
  key: string,
  ttl: number /* second */
) => {
  return sendCommand({
    id,
    command: 'EXPIRE',
    args: [key, ttl],
  })
}
