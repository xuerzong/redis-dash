import { create } from 'zustand'
import type { RedisKeyType } from '@client/constants/redisKeyTypes'

type RedisKeys = { key: string; type: RedisKeyType }[]

interface RedisStoreState {
  redisKeysMap: {
    [key: string]: RedisKeys
  }
}

const initState: RedisStoreState = {
  redisKeysMap: {},
}

const redisStore = create<RedisStoreState>(() => ({ ...initState }))

export const changeRedisKeys = (redisId: string, redisKeys: RedisKeys) => {
  redisStore.setState((currentState) => ({
    redisKeysMap: { ...currentState.redisKeysMap, [redisId]: redisKeys },
  }))
}

export const initRedisKeys = (redisId: string) => {
  const { redisKeysMap } = redisStore.getState()
  if (!Array.isArray(redisKeysMap[redisId])) {
    changeRedisKeys(redisId, [])
  }
}

export { redisStore as useRedisStore }
