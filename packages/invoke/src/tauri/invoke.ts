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
  role = 'publisher',
}: {
  id: string
  command: string
  args: any[]
  role?: string
}): Promise<T> => {
  return invoke('send_redis_command', {
    redisConfig: await getConnectionById(id),
    command,
    args: args.map(String),
    role,
  })
}

export const runRedisPsubscribe = async (id: string, channel: string) => {
  return invoke('run_redis_psubscribe', {
    redisConfig: await getConnectionById(id),
    channel,
    role: 'subscriber',
  })
}

export const runRedisPunsubscribe = async (channel: string) => {
  return invoke('run_redis_punsubscribe', {
    channel,
  })
}
