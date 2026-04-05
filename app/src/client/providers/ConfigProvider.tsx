import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useDarkMode } from '@client/hooks/useDarkMode'
import api from '@xuerzong/redis-dash-invoke/api'
import type { Config, Lang, Theme } from '@/types'
import { isTauri } from '@tauri-apps/api/core'
import { type } from '@tauri-apps/plugin-os'

interface ConfigContextState {
  config: Config
  updateConfig: (config: Partial<Config>) => void
}

type DisplayTheme = 'dark' | 'light'

const THEME_STYLE_MAP: Record<Exclude<Theme, 'system'>, string> = {
  'github-light': 'github-light',
  'github-dark': 'github-dark',
  'catppuccin-mocha': 'catppuccin-mocha',
  dracula: 'dracula',
  // Backward compatibility for old persisted values.
  light: 'github-light',
  dark: 'github-dark',
}

const resolveDisplayTheme = (
  theme: Theme,
  systemDarkMode: boolean
): DisplayTheme => {
  if (theme === 'system') {
    return systemDarkMode ? 'dark' : 'light'
  }

  if (theme === 'github-light' || theme === 'light') {
    return 'light'
  }

  return 'dark'
}

const resolveThemeStyle = (theme: Theme, systemDarkMode: boolean) => {
  if (theme === 'system') {
    return systemDarkMode ? 'github-dark' : 'github-light'
  }
  return THEME_STYLE_MAP[theme]
}

const normalizeTheme = (theme: Theme): Theme => {
  if (theme === 'dark') return 'github-dark'
  if (theme === 'light') return 'github-light'
  return theme
}

export const ConfigContext = React.createContext<ConfigContextState | null>(
  null
)
ConfigContext.displayName = 'ConfigContext'

export const useConfigContext = () => {
  const context = React.useContext(ConfigContext)
  if (!context) {
    throw new Error('useConfigContext must be used in <ConfigProvider />')
  }
  return context
}

export const useDisplayTheme = () => {
  const { config } = useConfigContext()
  const systemDarkMode = useDarkMode()

  return useMemo(() => {
    return resolveDisplayTheme(config.theme, systemDarkMode)
  }, [config, systemDarkMode])
}

export const ConfigProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const systemDarkMode = useDarkMode()
  const [config, setConfig] = useState<Config>({
    lang: (localStorage.getItem('rds-lang') as Lang) || 'en-US',
    theme: normalizeTheme(
      ((localStorage.getItem('rds-theme') as Theme) || 'system') as Theme
    ),
  })
  const theme = useMemo(() => {
    return resolveDisplayTheme(config.theme, systemDarkMode)
  }, [config, systemDarkMode])

  const themeStyle = useMemo(() => {
    return resolveThemeStyle(config.theme, systemDarkMode)
  }, [config, systemDarkMode])

  const lang = useMemo(() => {
    return config.lang
  }, [config])

  useEffect(() => {
    document.documentElement.style.setProperty('--transition-duration', '0s')

    if (theme === 'dark') {
      document.documentElement.classList.remove('light')
      document.documentElement.classList.add('dark')
      document.documentElement.style.colorScheme = 'dark'
    }

    if (theme === 'light') {
      document.documentElement.classList.remove('dark')
      document.documentElement.classList.add('light')
      document.documentElement.style.colorScheme = 'light'
    }

    document.documentElement.setAttribute('data-theme-style', themeStyle)

    setTimeout(() => {
      document.documentElement.style.setProperty(
        '--transition-duration',
        '0.1s'
      )
    })
    localStorage.setItem('rds-theme', config.theme)
  }, [config.theme, theme, themeStyle])

  useEffect(() => {
    document.documentElement.lang = lang
    localStorage.setItem('rds-lang', lang)
  }, [lang])

  useEffect(() => {
    if (isTauri()) {
      document.documentElement.setAttribute('data-tauri', type())
    }
  }, [])

  const fetchConfig = useCallback(async () => {
    const nextConfig = await api.getSystemConfig()
    if (nextConfig) {
      setConfig((pre) => ({
        ...pre,
        ...nextConfig,
        theme: normalizeTheme((nextConfig.theme as Theme) ?? pre.theme),
      }))
    }
  }, [])

  const updateConfig = useCallback(
    async (newConfig: Partial<Config>) => {
      const nextConfig = {
        ...config,
        ...newConfig,
        theme: normalizeTheme((newConfig.theme as Theme) ?? config.theme),
      }
      setConfig(nextConfig)
      await api.setSystemConfig(nextConfig)
      fetchConfig()
    },
    [config, fetchConfig]
  )

  useEffect(() => {
    fetchConfig()
  }, [])

  const value: ConfigContextState = useMemo(() => {
    return {
      config,
      updateConfig,
    }
  }, [config, updateConfig])

  return <ConfigContext value={value}>{children}</ConfigContext>
}
