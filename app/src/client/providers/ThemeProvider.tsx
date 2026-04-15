import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDarkMode } from '@client/hooks/useDarkMode'
import { allThemes, defaultDarkTheme, defaultLightTheme } from '@client/themes'
import type { Theme } from '@client/themes'
import type { ThemeMode } from '@/types'

interface ThemeContextState {
  mode: ThemeMode
  theme: Theme
  themes: Theme[]
  displayTheme: 'dark' | 'light'
  setMode: (mode: ThemeMode) => void
  setThemeId: (themeId: string) => void
}

const THEME_MODE_STORAGE_KEY = 'rds-theme-mode'
const THEME_ID_STORAGE_KEY = 'rds-theme-id'

const ThemeContext = React.createContext<ThemeContextState | null>(null)
ThemeContext.displayName = 'ThemeContext'

const isThemeMode = (value: string | null): value is ThemeMode => {
  return value === 'system' || value === 'light' || value === 'dark'
}

const getDisplayTheme = (
  mode: ThemeMode,
  systemDarkMode: boolean
): 'dark' | 'light' => {
  if (mode === 'system') {
    return systemDarkMode ? 'dark' : 'light'
  }

  return mode
}

const filterThemesByDisplayTheme = (displayTheme: 'dark' | 'light') => {
  return allThemes.filter((theme) => theme.dark === (displayTheme === 'dark'))
}

const resolveTheme = (
  themeId: string | null,
  displayTheme: 'dark' | 'light'
) => {
  const themes = filterThemesByDisplayTheme(displayTheme)
  return (
    themes.find((theme) => theme.id === themeId) ??
    (displayTheme === 'dark' ? defaultDarkTheme : defaultLightTheme)
  )
}

const setRootThemeVars = (theme: Theme) => {
  const root = document.documentElement

  root.style.setProperty('--color-primary', theme.baseColors.primary)
  root.style.setProperty(
    '--color-primary-foreground',
    theme.baseColors.primaryForeground
  )
  root.style.setProperty('--color-accent', theme.baseColors.accent)
  root.style.setProperty('--color-background', theme.baseColors.background)
  root.style.setProperty('--color-muted', theme.baseColors.muted)
  root.style.setProperty('--color-foreground', theme.baseColors.foreground)
  root.style.setProperty('--color-border', theme.baseColors.secondary)

  root.style.setProperty('--color-success', theme.baseColors.success)
  root.style.setProperty(
    '--color-success-bg',
    theme.baseColors.successForeground
  )
  root.style.setProperty('--color-warning', theme.baseColors.warning)
  root.style.setProperty(
    '--color-warning-bg',
    theme.baseColors.warningForeground
  )
  root.style.setProperty('--color-danger', theme.baseColors.danger)
  root.style.setProperty('--color-danger-bg', theme.baseColors.dangerForeground)

  root.style.setProperty('--redis-type-string', theme.tagColors.string)
  root.style.setProperty('--redis-type-list', theme.tagColors.list)
  root.style.setProperty('--redis-type-set', theme.tagColors.set)
  root.style.setProperty('--redis-type-zset', theme.tagColors.zset)
  root.style.setProperty('--redis-type-hash', theme.tagColors.hash)
  root.style.setProperty('--redis-type-stream', theme.tagColors.stream)
}

export const useThemeContext = () => {
  const context = React.useContext(ThemeContext)
  if (!context) {
    throw new Error('useThemeContext must be used in <ThemeProvider />')
  }
  return context
}

export const useDisplayTheme = () => {
  const { displayTheme } = useThemeContext()
  return displayTheme
}

export const ThemeProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const syncChannelRef = useRef<BroadcastChannel | null>(null)
  const systemDarkMode = useDarkMode()
  const [mode, setModeState] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem(THEME_MODE_STORAGE_KEY)
    return isThemeMode(stored) ? stored : 'system'
  })
  const [themeId, setThemeIdState] = useState<string | null>(() => {
    return localStorage.getItem(THEME_ID_STORAGE_KEY)
  })

  const displayTheme = useMemo(() => {
    return getDisplayTheme(mode, systemDarkMode)
  }, [mode, systemDarkMode])

  const themes = useMemo(() => {
    return filterThemesByDisplayTheme(displayTheme)
  }, [displayTheme])

  const theme = useMemo(() => {
    return resolveTheme(themeId, displayTheme)
  }, [displayTheme, themeId])

  useEffect(() => {
    document.documentElement.style.setProperty('--transition-duration', '0s')
    document.documentElement.classList.toggle('dark', displayTheme === 'dark')
    document.documentElement.classList.toggle('light', displayTheme === 'light')
    document.documentElement.style.colorScheme = displayTheme
    setRootThemeVars(theme)
    document.documentElement.setAttribute('data-theme-id', theme.id)

    setTimeout(() => {
      document.documentElement.style.setProperty(
        '--transition-duration',
        '0.1s'
      )
    })
  }, [displayTheme, theme])

  useEffect(() => {
    localStorage.setItem(THEME_MODE_STORAGE_KEY, mode)
  }, [mode])

  useEffect(() => {
    localStorage.setItem(THEME_ID_STORAGE_KEY, theme.id)
  }, [theme.id])

  useEffect(() => {
    let channel: BroadcastChannel | null = null
    if ('BroadcastChannel' in window) {
      channel = new BroadcastChannel('rds-theme-sync')
      syncChannelRef.current = channel

      channel.onmessage = (
        event: MessageEvent<{ mode: ThemeMode; themeId: string }>
      ) => {
        if (!event.data) return
        setModeState(event.data.mode)
        setThemeIdState(event.data.themeId)
      }
    }

    const onStorage = (event: StorageEvent) => {
      if (event.key === THEME_MODE_STORAGE_KEY) {
        const nextMode = localStorage.getItem(THEME_MODE_STORAGE_KEY)
        if (isThemeMode(nextMode)) {
          setModeState(nextMode)
        }
      }

      if (event.key === THEME_ID_STORAGE_KEY) {
        setThemeIdState(localStorage.getItem(THEME_ID_STORAGE_KEY))
      }
    }

    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener('storage', onStorage)
      channel?.close()
      syncChannelRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!themes.some((item) => item.id === theme.id)) {
      setThemeIdState(themes[0]?.id ?? null)
    }
  }, [theme.id, themes])

  const setMode = useCallback(
    (nextMode: ThemeMode) => {
      const nextDisplayTheme = getDisplayTheme(nextMode, systemDarkMode)
      const nextTheme = resolveTheme(themeId, nextDisplayTheme)
      setModeState(nextMode)
      setThemeIdState(nextTheme.id)
      syncChannelRef.current?.postMessage({
        mode: nextMode,
        themeId: nextTheme.id,
      })
    },
    [systemDarkMode, themeId]
  )

  const setThemeId = useCallback(
    (nextThemeId: string) => {
      setThemeIdState(nextThemeId)
      syncChannelRef.current?.postMessage({ mode, themeId: nextThemeId })
    },
    [mode]
  )

  const value = useMemo(() => {
    return {
      mode,
      theme,
      themes,
      displayTheme,
      setMode,
      setThemeId,
    }
  }, [displayTheme, mode, setMode, setThemeId, theme, themes])

  return <ThemeContext value={value}>{children}</ThemeContext>
}
