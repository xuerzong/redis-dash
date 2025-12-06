import { isTauri } from '@tauri-apps/api/core'
import * as tauriInvoke from './tauri/invoke'
import * as broswerInvoke from './browser/invoke'
import type { InvokeFunc } from './types'

export const invoke: InvokeFunc = <T = any>(
  command: string,
  data: any
): Promise<T> => {
  if (isTauri()) {
    return tauriInvoke.invoke(command, data)
  } else {
    return broswerInvoke.invoke(command, data)
  }
}

export const sendCommand = <T = any>(commandParams: {
  id: string
  command: string
  args: any[]
}): Promise<T> => {
  if (isTauri()) {
    return tauriInvoke.sendCommand(commandParams)
  } else {
    return broswerInvoke.sendCommand(commandParams)
  }
}
