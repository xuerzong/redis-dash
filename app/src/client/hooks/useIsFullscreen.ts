import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow'
import { useDebounce } from 'use-debounce'
import { useWindowSize } from 'react-use'
import { useEffect, useMemo, useRef, useState } from 'react'

export const useIsFullscreen = () => {
  const windowSize = useWindowSize()
  const [debouncedWindowSize] = useDebounce(windowSize, 100)
  const windowSizeKey = useMemo(() => {
    return `${debouncedWindowSize.width}_${debouncedWindowSize.height}`
  }, [debouncedWindowSize])
  const [isFullscreen, setIsFullscreen] = useState<Record<string, boolean>>({})
  const queryId = useRef(0)

  useEffect(() => {
    queryId.current = queryId.current + 1
    const currentQueryId = queryId.current
    getCurrentWebviewWindow()
      .isFullscreen()
      .then((isFullscreen: boolean) => {
        if (queryId.current === currentQueryId) {
          setIsFullscreen((pre) =>
            typeof pre[windowSizeKey] === 'undefined'
              ? {
                  ...pre,
                  [windowSizeKey]: isFullscreen,
                }
              : pre
          )
        }
      })
  }, [windowSizeKey])

  return isFullscreen[windowSizeKey] ?? false
}
