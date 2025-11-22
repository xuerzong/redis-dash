import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { RedisKeyType } from '@/constants/redisKeyTypes'
import { getKeys, getRedisState } from '../commands/redis'

interface RedisStoreState {
  id: string
  searchValue: string
  filterType: string
  keysCountLimit: number
  selectedKey: string
  viewerState: {
    data: {
      keyName: string
      ttl: number
      type: RedisKeyType | 'UNSET'
      value: any
    }
    loading: boolean
  }
  keysState: {
    loading: boolean
    data: { key: string; type: RedisKeyType }[]
  }
  keyTypes: Record<string, string>
}

const initState: RedisStoreState = {
  id: '',
  searchValue: '',
  filterType: 'all',
  selectedKey: '',
  viewerState: {
    data: {
      keyName: '',
      ttl: -1,
      type: 'STRING',
      value: null,
    },
    loading: false,
  },
  keysState: {
    data: [],
    loading: false,
  },
  keyTypes: {},
  keysCountLimit: 100,
}

const redisStore = create<RedisStoreState>()(
  subscribeWithSelector(() => ({ ...initState }))
)

export const changeRedisId = (id: string) => {
  redisStore.setState({ id })
}

export const changeSearchValue = (searchValue: string) => {
  redisStore.setState({ searchValue })
}

export const changeFilterType = (filterType: string) => {
  redisStore.setState({ filterType })
}

export const changeSelectedKey = (selectedKey: string) => {
  redisStore.setState({ selectedKey })
}

export const changeKeysCountLimit = (keysCountLimit: number) => {
  redisStore.setState({ keysCountLimit })
}

export const changeViewerState = (
  newViewerState: Partial<RedisStoreState['viewerState']>
) => {
  redisStore.setState((pre) => ({
    viewerState: { ...pre.viewerState, ...newViewerState },
  }))
}

export const changeKeysState = (
  newKeysState: Partial<RedisStoreState['keysState']>
) => {
  redisStore.setState((pre) => ({
    keysState: { ...pre.keysState, ...newKeysState },
  }))
}

declare global {
  interface Window {
    lastRequestId: number
  }
}

export const queryRedisViewerState = async (id: string, key: string) => {
  const lastRequestId = window.lastRequestId || 0 + 1
  window.lastRequestId = lastRequestId
  changeViewerState({ loading: true })
  if (import.meta.env.MODE === 'development') {
    await new Promise((res) => setTimeout(res, 1000))
  }
  const redisState = await getRedisState(id, key)

  if (lastRequestId !== window.lastRequestId) return

  changeViewerState({ data: redisState, loading: false })
}

export const queryRedisKeys = async (
  id: string,
  params?: { match?: string; count?: number }
) => {
  let getKeyParams = params
  if (!getKeyParams) {
    const { searchValue, keysCountLimit } = redisStore.getState()
    getKeyParams = { match: searchValue, count: keysCountLimit }
  }
  changeKeysState({ loading: true })
  return getKeys(id, getKeyParams).then((keysWithType) => {
    changeKeysState({ loading: false, data: keysWithType })
  })
}

redisStore.subscribe(
  (state) => ({
    id: state.id,
    searchValue: state.searchValue,
    keysCountLimit: state.keysCountLimit,
  }),
  (newState) => {
    if (newState.id) {
      queryRedisKeys(newState.id, {
        match: newState.searchValue,
        count: newState.keysCountLimit,
      })
    }
  },
  {
    equalityFn: (a, b) =>
      a.id === b.id &&
      a.searchValue === b.searchValue &&
      a.keysCountLimit === b.keysCountLimit,
  }
)

redisStore.subscribe(
  (state) => state.id,
  (newId) => {
    // Reset all state
    redisStore.setState({
      ...initState,
      id: newId,
    })
  }
)

export { redisStore as useRedisStore }
