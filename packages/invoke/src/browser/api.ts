import { invoke } from './invoke'
import { createApi } from '../shared/api'

export const sendRequest = <T = any>(data: {
  method: 'GET' | 'POST' | 'DELETE' | 'PUT'
  url: string
  body?: any
  query?: any
}): Promise<T> => {
  return invoke('sendRequest', data)
}

const api = createApi(sendRequest)

export const getConnections = api.getConnections
export const createConnection = api.createConnection
export const updateConnection = api.updateConnection
export const delConnection = api.delConnection
export const getConnectionStatus = api.getConnectionStatus
export const postDisconnectConnection = api.postDisconnectConnection
export const getSystemConfig = api.getSystemConfig
export const setSystemConfig = api.setSystemConfig
export const getMonoFonts = api.getMonoFonts
