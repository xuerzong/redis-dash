import { invoke as tauriInvoke } from '@tauri-apps/api/core'
import type { InvokeFunc } from '../types'
import { getConnectionById } from './api'

export const invoke: InvokeFunc = (command, data) => {
  return tauriInvoke(command, data)
}

export const sendCommand = async <T = any>({
  id,
  command,
  args,
}: {
  id: string
  command: string
  args: any[]
}): Promise<T> => {
  return invoke('send_redis_command', {
    redisConfig: await getConnectionById(id),
    command,
    args: args.map(String),
  })
}
