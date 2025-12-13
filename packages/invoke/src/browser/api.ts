import { invoke } from './invoke'

export const sendRequest = <T = any>(data: {
  method: 'GET' | 'POST' | 'DELETE' | 'PUT'
  url: string
  body?: any
  query?: any
}): Promise<T> => {
  return invoke('sendRequest', data)
}

export const getConnections = async () => {
  return sendRequest<any[]>({
    url: '/api/connections',
    method: 'GET',
  })
}

export const createConnection = async (data: any) => {
  return sendRequest<string>({
    method: 'POST',
    url: '/api/connections',
    body: data,
  })
}

export const updateConnection = async (id: string, data: any) => {
  return sendRequest({
    method: 'PUT',
    url: `/api/connections/${id}`,
    body: data,
  })
}

export const delConnection = async (id: string) => {
  return sendRequest({
    url: `/api/connections/${id}`,
    method: 'DELETE',
  })
}

export const getConnectionStatus = async (id: string) => {
  return sendRequest<number>({
    method: 'GET',
    url: `/api/connections/status?id=${id}`,
  })
}

export const postDisconnectConnection = async (id: string, role?: string) => {
  return sendRequest<number>({
    method: 'POST',
    url: `/api/connections/${id}/disconnect`,
    body: { role },
  })
}

export const getSystemConfig = () => {
  return sendRequest<any>({
    method: 'GET',
    url: '/api/config',
  })
}

export const setSystemConfig = (config: any) => {
  return sendRequest({
    method: 'POST',
    url: '/api/config',
    body: config,
  })
}
