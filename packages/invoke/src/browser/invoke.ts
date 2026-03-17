import type { InvokeFunc } from '../types'
import { createInvokeAdapter } from '../shared/invoke'

export const invoke: InvokeFunc = (command, data) => {
  return window.invoke(command, data)
}

const adapter = createInvokeAdapter({
  invoke,
  requestCommand: 'sendRequest',
  redisMode: 'legacy-command',
})

export const sendRequest = adapter.sendRequest
export const sendCommand = adapter.sendCommand
export const runRedisPsubscribe = adapter.runRedisPsubscribe
export const runRedisPunsubscribe = adapter.runRedisPunsubscribe
