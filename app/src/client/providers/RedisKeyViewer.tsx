import React, { useMemo } from 'react'
import type { RedisKeyType } from '@/constants/redisKeyTypes'

interface RedisKeyViewerContextState {
  redisId: string
  redisKeyState: {
    keyName: string
    ttl: number
    type: RedisKeyType | 'UNSET'
    value: any
  }
  refreshRedisKeyState: () => void
}

export const RedisKeyViewerContext =
  React.createContext<RedisKeyViewerContextState | null>(null)

interface RedisKeyViewerProviderProps extends RedisKeyViewerContextState {}

export const useRedisKeyViewerContext = () => {
  const context = React.useContext(RedisKeyViewerContext)
  if (context === null) {
    throw new Error(
      'useRedisKeyViewerContext must be used in <RedisKeyViewerProvider />'
    )
  }
  return context
}

export const RedisKeyViewerProvider: React.FC<
  React.PropsWithChildren<RedisKeyViewerProviderProps>
> = ({ children, redisId, redisKeyState, refreshRedisKeyState }) => {
  const value: RedisKeyViewerContextState = useMemo(() => {
    return {
      redisId,
      redisKeyState,
      refreshRedisKeyState,
    }
  }, [redisId, redisKeyState, refreshRedisKeyState])

  return <RedisKeyViewerContext value={value}>{children}</RedisKeyViewerContext>
}
