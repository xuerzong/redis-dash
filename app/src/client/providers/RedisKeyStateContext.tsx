import React, { useEffect, useMemo, useState } from 'react'
import type { RedisKeyType } from '@/constants/redisKeyTypes'
import { useDebouncedCallback } from 'use-debounce'
import { getRedisState } from '../commands/redis'
import { useRedisId } from '../hooks/useRedisId'
import { useRedisContext } from './RedisContext'

interface RedisKeyViewerContextState {
  redisId: string
  redisKeyState: {
    keyName: string
    ttl: number
    type: RedisKeyType | 'UNSET'
    value: any
  }
  refreshRedisKeyState: (keyName?: string) => void
  tableProps: {
    pageNo: number
    pageSize: number
  }
  setTableProps: (tableProps: RedisKeyViewerContextState['tableProps']) => void
  loading: boolean

  filterValue: string
  setFilterValue: (value: string) => void
}

export const RedisKeyViewerContext =
  React.createContext<RedisKeyViewerContextState | null>(null)

interface RedisKeyStateProviderProps {}

export const useRedisKeyStateContext = () => {
  const context = React.useContext(RedisKeyViewerContext)
  if (context === null) {
    throw new Error(
      'useRedisKeyStateContext must be used in <RedisKeyStateProvider />'
    )
  }
  return context
}

export const RedisKeyStateProvider: React.FC<
  React.PropsWithChildren<RedisKeyStateProviderProps>
> = ({ children }) => {
  const [tableProps, setTableProps] = useState({
    pageNo: 1,
    pageSize: 100,
  })

  const redisId = useRedisId()
  const { selectedKey } = useRedisContext()
  const [loading, setLoading] = useState(true)
  const [filterValue, setFilterValue] = useState('')

  const [state, setState] = useState<{
    keyName: string
    ttl: number
    type: 'STRING' | 'HASH' | 'ZSET' | 'SET' | 'STREAM' | 'LIST' | 'UNSET'
    value: any
  }>({
    keyName: '',
    ttl: 0,
    type: 'UNSET',
    value: {},
  })

  const queryRedisKeyState = useDebouncedCallback(
    async (redisId: string, selectedKey: string, params: typeof tableProps) => {
      setLoading(true)
      if (import.meta.env.MODE === 'development') {
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
      await getRedisState(redisId, selectedKey, params)
        .then((nextState) => {
          setState(nextState)
        })
        .finally(() => {
          setLoading(false)
        })
    },
    100
  )

  useEffect(() => {
    if (redisId && selectedKey) {
      queryRedisKeyState(redisId, selectedKey, tableProps)
    }
  }, [redisId, selectedKey, tableProps])

  useEffect(() => {
    setFilterValue('')
  }, [redisId, selectedKey])

  const value: RedisKeyViewerContextState = useMemo(() => {
    return {
      redisId,
      redisKeyState: state,
      refreshRedisKeyState: () => {
        queryRedisKeyState(redisId, selectedKey, tableProps)
      },
      tableProps,
      setTableProps,
      loading,

      filterValue,
      setFilterValue,
    }
  }, [
    redisId,
    state,
    selectedKey,
    queryRedisKeyState,
    tableProps,
    loading,
    filterValue,
  ])

  return <RedisKeyViewerContext value={value}>{children}</RedisKeyViewerContext>
}
