import { invoke as tauriInvoke } from '@tauri-apps/api/core'
import type { InvokeFunc } from '../types'
import { createInvokeAdapter } from '../shared/invoke'

export const invoke: InvokeFunc = (command, data) => {
  return tauriInvoke(command, data)
}

const adapter = createInvokeAdapter({
  invoke,
  requestCommand: 'send_request',
  redisMode: 'http-request',
  requestPayloadMapper: (data) => ({
    method: data.method,
    url: data.url,
    body: data.body ?? null,
  }),
})

export const sendRequest = adapter.sendRequest
export const sendCommand = adapter.sendCommand
export const runRedisPsubscribe = adapter.runRedisPsubscribe
export const runRedisPunsubscribe = adapter.runRedisPunsubscribe
