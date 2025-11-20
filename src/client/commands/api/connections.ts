import { sendRequest } from '@/client/utils/invoke'

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
