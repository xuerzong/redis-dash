import React, { useMemo, useState } from 'react'

export const viewModes = ['list', 'tree'] as const

export type ViewModeType = (typeof viewModes)[number]

interface RedisKeysMenuContextState {
  viewMode: ViewModeType
  setViewMode: (viewMode: ViewModeType) => void
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
  const [viewMode, setViewMode] = useState<ViewModeType>('tree')

  const value: RedisKeysMenuContextState = useMemo(() => {
    return {
      viewMode,
      setViewMode,
    }
  }, [viewMode])

  return (
    <RedisKeysMenuContext.Provider value={value}>
      {children}
    </RedisKeysMenuContext.Provider>
  )
}
