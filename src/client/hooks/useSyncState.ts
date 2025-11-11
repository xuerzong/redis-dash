import { useEffect, useState } from 'react'

export const useSyncState = <T = any>(defaultValue: T) => {
  const [value, setValue] = useState<T>(defaultValue)

  useEffect(() => {
    setValue(defaultValue)
  }, [defaultValue])

  return [value, setValue] as const
}
