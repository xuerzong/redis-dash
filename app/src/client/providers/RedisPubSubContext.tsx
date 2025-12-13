import React, { useMemo, useState } from 'react'

interface RedisPubSubContextState {
  channel: string
  setChannel: (channel: string) => void
}

const RedisPubSubContext = React.createContext<RedisPubSubContextState | null>(
  null
)

export const useRedisPubSubContext = () => {
  const context = React.useContext(RedisPubSubContext)
  if (!context) {
    throw new Error(
      'useRedisPubSubContext must be used in <RedisPubSubProvider />'
    )
  }
  return context
}

export const RedisPubSubProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const [channel, setChannel] = useState('')
  const value: RedisPubSubContextState = useMemo(() => {
    return {
      channel,
      setChannel,
    }
  }, [channel])
  return <RedisPubSubContext value={value}>{children}</RedisPubSubContext>
}
