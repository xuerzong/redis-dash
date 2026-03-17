import { invoke } from './invoke'

export const sendRequest = <T = any>(data: {
  method: 'GET' | 'POST' | 'DELETE' | 'PUT'
  url: string
  body?: any
  query?: any
}): Promise<T> => {
  return invoke('send_request', {
    method: data.method,
    url: data.url,
    body: data.body ?? null,
  })
}

export const createConnection = async (data: any) => {
  return sendRequest<string>({
    method: 'POST',
    url: '/api/connections',
    body: data,
  })
}

export const getConnections = async () => {
  return sendRequest<any[]>({
    method: 'GET',
    url: '/api/connections',
  })
}

export const getConnectionById = async (id: string) => {
  const connections = await getConnections()
  const connection = connections.find((item) => item.id === id)
  if (!connection) {
    throw new Error(`No connection found with ID: ${id}`)
  }
  return connection
}

export const updateConnection = async (id: string, data: any) => {
  return sendRequest<string>({
    method: 'PUT',
    url: `/api/connections/${id}`,
    body: data,
  })
}

export const delConnection = async (id: string) => {
  return sendRequest({
    method: 'DELETE',
    url: `/api/connections/${id}`,
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

export const getSystemConfig = async () => {
  return sendRequest<any>({
    method: 'GET',
    url: '/api/config',
  })
}

export const setSystemConfig = async (config: any) => {
  return sendRequest({
    method: 'POST',
    url: '/api/config',
    body: config,
  })
}
