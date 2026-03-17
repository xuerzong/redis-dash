type RequestData = {
  method: 'GET' | 'POST' | 'DELETE' | 'PUT'
  url: string
  body?: any
  query?: any
}

type SendRequest = <T = any>(data: RequestData) => Promise<T>

export const createApi = (sendRequest: SendRequest) => {
  const getConnections = async () => {
    return sendRequest<any[]>({
      method: 'GET',
      url: '/api/connections',
    })
  }

  const createConnection = async (data: any) => {
    return sendRequest<string>({
      method: 'POST',
      url: '/api/connections',
      body: data,
    })
  }

  const updateConnection = async (id: string, data: any) => {
    return sendRequest<string>({
      method: 'PUT',
      url: `/api/connections/${id}`,
      body: data,
    })
  }

  const delConnection = async (id: string) => {
    return sendRequest({
      method: 'DELETE',
      url: `/api/connections/${id}`,
    })
  }

  const getConnectionStatus = async (id: string) => {
    return sendRequest<number>({
      method: 'GET',
      url: `/api/connections/status?id=${id}`,
    })
  }

  const postDisconnectConnection = async (id: string, role?: string) => {
    return sendRequest<number>({
      method: 'POST',
      url: `/api/connections/${id}/disconnect`,
      body: { role },
    })
  }

  const getSystemConfig = async () => {
    return sendRequest<any>({
      method: 'GET',
      url: '/api/config',
    })
  }

  const setSystemConfig = async (config: any) => {
    return sendRequest({
      method: 'POST',
      url: '/api/config',
      body: config,
    })
  }

  return {
    getConnections,
    createConnection,
    updateConnection,
    delConnection,
    getConnectionStatus,
    postDisconnectConnection,
    getSystemConfig,
    setSystemConfig,
  }
}
