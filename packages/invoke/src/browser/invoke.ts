import type { InvokeFunc } from '../types'

export const invoke: InvokeFunc = (command, data) => {
  return window.invoke(command, data)
}

export const sendCommand = <T = any>(data: {
  id: string
  command: string
  args: any[]
  role?: string
}): Promise<T> => {
  return invoke('sendCommand', data)
}
