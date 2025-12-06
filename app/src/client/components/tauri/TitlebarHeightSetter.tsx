import { useIsFullscreen } from '@client/hooks/useIsFullscreen'
import { isTauri } from '@tauri-apps/api/core'
import { useEffect } from 'react'

export const TauriTitlebarSetter = () => {
  const isFullscreen = useIsFullscreen()

  useEffect(() => {
    const titlebarHeight = isFullscreen ? 0 : 29
    document.documentElement.style.setProperty(
      '--titlebar-height',
      `${titlebarHeight}px`
    )
  }, [isFullscreen])

  if (isFullscreen) {
    return null
  }

  return null
}

export const BroswerTitlebarSetter = () => {
  useEffect(() => {
    document.documentElement.style.setProperty('--titlebar-height', `${0}px`)
  }, [])
  return null
}

export const TitlebarHeightSetter = () => {
  if (isTauri()) return <TauriTitlebarSetter />
  return <BroswerTitlebarSetter />
}
