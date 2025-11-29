import type { Config } from '@/types'
import { sendRequest } from '@client/utils/invoke'

export const getSystemConfig = () => {
  return sendRequest<Config>({
    method: 'GET',
    url: '/api/config',
  })
}

export const setSystemConfig = (config: Config) => {
  return sendRequest({
    method: 'POST',
    url: '/api/config',
    body: config,
  })
}
