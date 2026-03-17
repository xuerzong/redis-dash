import { invoke as tauriInvoke } from '@tauri-apps/api/core'
import type { InvokeFunc } from '../types'

export const invoke: InvokeFunc = (command, data) => {
  return tauriInvoke(command, data)
}

const sendRequest = <T = any>(data: {
  method: 'GET' | 'POST' | 'DELETE' | 'PUT'
  url: string
  body?: any
}): Promise<T> => {
  return tauriInvoke('send_request', {
    method: data.method,
    url: data.url,
    body: data.body ?? null,
  })
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
  const upperCommand = command.toUpperCase()

  if (upperCommand === 'PSUBSCRIBE') {
    return sendRequest<T>({
      method: 'POST',
      url: '/api/redis/psubscribe',
      body: {
        id,
        channel: String(args[0] ?? ''),
        role,
      },
    })
  }

  if (upperCommand === 'PUNSUBSCRIBE') {
    return sendRequest<T>({
      method: 'POST',
      url: '/api/redis/punsubscribe',
      body: {
        id,
        channel: String(args[0] ?? ''),
        role,
      },
    })
  }

  return sendRequest<T>({
    method: 'POST',
    url: '/api/redis/command',
    body: {
      id,
      command,
      args,
      role,
    },
  })
}

export const runRedisPsubscribe = async (id: string, channel: string) => {
  return sendRequest({
    method: 'POST',
    url: '/api/redis/psubscribe',
    body: {
      id,
      channel,
      role: 'subscriber',
    },
  })
}

export const runRedisPunsubscribe = async (channel: string) => {
  return sendRequest({
    method: 'POST',
    url: '/api/redis/punsubscribe',
    body: {
      channel,
    },
  })
}
