import { create } from 'zustand'
import type { RedisKeyType } from '@/constants/redisKeyTypes'

interface RedisStoreState {
  redisKeys: { key: string; type: RedisKeyType }[]
}

const initState: RedisStoreState = {
  redisKeys: [],
}

const redisStore = create<RedisStoreState>(() => ({ ...initState }))

export const changeRedisKeys = (redisKeys: RedisStoreState['redisKeys']) => {
  redisStore.setState({ redisKeys })
}

export { redisStore as useRedisStore }
