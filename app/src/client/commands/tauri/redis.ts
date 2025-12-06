import { invoke } from '@tauri-apps/api/core'
import { getConnections } from './api'

export const sendCommand = async (
  redisId: string,
  command: string,
  args: any[]
) => {
  const connections = await getConnections()
  const conn = connections.find((conn) => conn.id === redisId)
  if (!conn) return
  const result = await invoke('send_redis_command', {
    redisConfig: conn,
    command,
    args: args.map(String),
  })
  return result
}
