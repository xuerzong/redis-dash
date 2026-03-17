import type { InvokeFunc } from '../types'

export type RequestData = {
  method: 'GET' | 'POST' | 'DELETE' | 'PUT'
  url: string
  body?: any
  query?: any
}

export type CommandParams = {
  id: string
  command: string
  args: any[]
  role?: string
}

type RedisMode = 'legacy-command' | 'http-request'

interface CreateInvokeAdapterOptions {
  invoke: InvokeFunc
  requestCommand: string
  redisMode: RedisMode
  requestPayloadMapper?: (data: RequestData) => any
  legacyRedisCommand?: string
}

export const createInvokeAdapter = ({
  invoke,
  requestCommand,
  redisMode,
  requestPayloadMapper,
  legacyRedisCommand = 'sendCommand',
}: CreateInvokeAdapterOptions) => {
  const sendRequest = <T = any>(data: RequestData): Promise<T> => {
    const payload = requestPayloadMapper ? requestPayloadMapper(data) : data
    return invoke(requestCommand, payload)
  }

  const sendCommand = async <T = any>({
    id,
    command,
    args,
    role = 'publisher',
  }: CommandParams): Promise<T> => {
    if (redisMode === 'legacy-command') {
      return invoke(legacyRedisCommand, {
        id,
        command,
        args,
        role,
      })
    }

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

  const runRedisPsubscribe = async (id: string, channel: string) => {
    return sendCommand({
      id,
      command: 'PSUBSCRIBE',
      args: [channel],
      role: 'subscriber',
    })
  }

  const runRedisPunsubscribe = async (id: string, channel: string) => {
    return sendCommand({
      id,
      command: 'PUNSUBSCRIBE',
      args: [channel],
      role: 'subscriber',
    })
  }

  return {
    invoke,
    sendRequest,
    sendCommand,
    runRedisPsubscribe,
    runRedisPunsubscribe,
  }
}
