import type { RedisKeyType } from '@/constants/redisKeyTypes'
import React, { useEffect, useMemo, useState } from 'react'
import { TreeNode, keysToTree } from '../utils/tree'
import { getKeys } from '../commands/redis'
import { useRedisId } from '../hooks/useRedisId'
import { changeRedisKeys, useRedisStore } from '../stores/redisStore'

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
}

const RedisKeysMenuContext =
  React.createContext<RedisKeysMenuContextState | null>(null)

RedisKeysMenuContext.displayName = 'RedisKeysMenuContext'

export const useRedisKeysMenuContext = () => {
  const context = React.useContext(RedisKeysMenuContext)
  if (!context) {
    throw new Error(
      'useRedisKeysMenuContext must be used in <RedisKeysMenuProvider />'
    )
  }
  return context
}

export const RedisKeysMenuProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const redisId = useRedisId()
  const [viewMode, setViewMode] = useState<ViewModeType>('tree')
  const [searchValue, setSearchValue] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [loading, setLoading] = useState(false)
  const redisKeys = useRedisStore((state) => state.redisKeys)

  const queryRedisKeys = (
    redisId: string,
    params?: { match?: string; count?: number }
  ) => {
    setLoading(true)
    return getKeys(redisId, {
      ...{ match: searchValue, count: 200 },
      ...params,
    })
      .then(changeRedisKeys)
      .finally(() => {
        setLoading(false)
      })
  }

  useEffect(() => {
    queryRedisKeys(redisId, { match: searchValue })
  }, [redisId, searchValue])

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
    }
  }, [
    redisId,
    viewMode,
    redisKeys,
    searchValue,
    filterType,
    keyTreeNodes,
    loading,
  ])

  return (
    <RedisKeysMenuContext.Provider value={value}>
      {children}
    </RedisKeysMenuContext.Provider>
  )
}
