import React, { useMemo, useState } from 'react'

interface RedisContextState {
  selectedKey: string
  setSelectedKey: (key: string) => void
}

export const RedisContext = React.createContext<RedisContextState | null>(null)
RedisContext.displayName = 'RedisContext'

export const useRedisContext = () => {
  const context = React.useContext(RedisContext)
  if (!context) {
    throw new Error('useRedisContext must be used in <RedisProvider />')
  }
  return context
}

export const RedisProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const [selectedKey, setSelectedKey] = useState('')
  const value: RedisContextState = useMemo(() => {
    return {
      selectedKey,
      setSelectedKey,
    }
  }, [selectedKey])
  return <RedisContext.Provider value={value}>{children}</RedisContext.Provider>
}
