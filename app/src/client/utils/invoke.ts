import { invoke } from '@xuerzong/redis-studio-invoke'

export const sendCommand = <T = any>(data: {
  id: string
  command: string
  args: any[]
}): Promise<T> => {
  return invoke('sendCommand', data)
}

export const sendRequest = <T = any>(data: {
  method: 'GET' | 'POST' | 'DELETE' | 'PUT'
  url: string
  body?: any
  query?: any
}): Promise<T> => {
  return invoke('sendRequest', data)
}
