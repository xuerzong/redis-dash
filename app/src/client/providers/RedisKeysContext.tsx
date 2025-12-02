import type { RedisKeyType } from '@client/constants/redisKeyTypes'
import React, { useEffect, useMemo, useState } from 'react'
import { TreeNode, keysToTree } from '@client/utils/tree'
import { getKeys } from '@client/commands/redis'
import { useRedisId } from '@client/hooks/useRedisId'
import {
  changeRedisKeys,
  initRedisKeys,
  useRedisStore,
} from '@client/stores/redisStore'
import { useDebounce } from 'use-debounce'

export const viewModes = ['list', 'tree'] as const

export type ViewModeType = (typeof viewModes)[number]

interface RedisKeysMenuContextState {
  keys: { key: string; type: RedisKeyType }[]
  keyTreeNodes: TreeNode[]

  searchValue: string
  setSearchValue: (searchValue: string) => void

  filterType: string
  setFilterType: (filterType: string) => void

  viewMode: ViewModeType
  setViewMode: (viewMode: ViewModeType) => void

  refreshKeys: () => Promise<void>
  loading: boolean

  keysCountLimit: number
  setKeysCountLimit: (value: number) => void
}

const RedisKeysMenuContext =
  React.createContext<RedisKeysMenuContextState | null>(null)

RedisKeysMenuContext.displayName = 'RedisKeysMenuContext'

export const useRedisKeysContext = () => {
  const context = React.useContext(RedisKeysMenuContext)
  if (!context) {
    throw new Error('useRedisKeysContext must be used in <RedisKeysProvider />')
  }
  return context
}

export const RedisKeysProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const redisId = useRedisId()
  const [viewMode, setViewMode] = useState<ViewModeType>('list')
  const [searchValue, setSearchValue] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [loading, setLoading] = useState(false)
  const [keysCountLimit, setKeysCountLimit] = useState(200)
  const redisKeys = useRedisStore((state) => state.redisKeysMap[redisId])

  const [debouncedSearchValue] = useDebounce(searchValue, 500)

  const queryRedisKeys = async (
    redisId: string,
    params?: { match?: string; count?: number }
  ) => {
    setLoading(true)
    const currentRedisId = redisId
    return getKeys(redisId, {
      ...{ match: searchValue, count: keysCountLimit },
      ...params,
    })
      .then((keys) => {
        // Prevent race condition in queryRedisKeys
        if (currentRedisId === redisId) {
          changeRedisKeys(redisId, keys)
        }
      })
      .finally(() => {
        setLoading(false)
      })
  }

  useEffect(() => {
    initRedisKeys(redisId)
  }, [redisId])

  useEffect(() => {
    queryRedisKeys(redisId, {
      match: debouncedSearchValue,
      count: keysCountLimit,
    })
  }, [redisId, debouncedSearchValue, keysCountLimit])

  const keyTreeNodes = useMemo(() => {
    const filteredKeys = (redisKeys || [])
      .filter((key) => filterType === 'all' || key.type === filterType)
      .map((key) => key.key)

    if (viewMode === 'tree') {
      return keysToTree(filteredKeys)
    }
    return filteredKeys.map((key) => new TreeNode(key))
  }, [redisKeys, filterType, viewMode])

  const value: RedisKeysMenuContextState = useMemo(() => {
    return {
      keys: redisKeys,
      keyTreeNodes,

      searchValue,
      setSearchValue,

      filterType,
      setFilterType,

      viewMode,
      setViewMode,

      loading,

      refreshKeys: async () => {
        return queryRedisKeys(redisId, { match: searchValue })
      },

      keysCountLimit,
      setKeysCountLimit,
    }
  }, [
    redisId,
    viewMode,
    redisKeys,
    searchValue,
    filterType,
    keyTreeNodes,
    loading,
    keysCountLimit,
  ])

  return (
    <RedisKeysMenuContext.Provider value={value}>
      {children}
    </RedisKeysMenuContext.Provider>
  )
}
