import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useDarkMode } from '@client/hooks/useDarkMode'
import api from '@xuerzong/redis-studio-invoke/api'
import type { Config, Lang, Theme } from '@/types'
import { isTauri } from '@tauri-apps/api/core'
import { type } from '@tauri-apps/plugin-os'

interface ConfigContextState {
  config: Config
  updateConfig: (config: Partial<Config>) => void
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
    if (config.theme === 'system') {
      return systemDarkMode ? 'dark' : 'light'
    }
    return config.theme
  }, [config, systemDarkMode])
}

export const ConfigProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const systemDarkMode = useDarkMode()
  const [config, setConfig] = useState<Config>({
    lang: (localStorage.getItem('rds-lang') as Lang) || 'en-US',
    theme: (localStorage.getItem('rds-theme') as Theme) || 'system',
  })
  const theme = useMemo(() => {
    if (config.theme === 'system') {
      return systemDarkMode ? 'dark' : 'light'
    }
    return config.theme
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

    setTimeout(() => {
      document.documentElement.style.setProperty(
        '--transition-duration',
        '0.1s'
      )
    })
    localStorage.setItem('rds-theme', theme)
  }, [theme])

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
      setConfig((pre) => ({ ...pre, ...nextConfig }))
    }
  }, [])

  const updateConfig = useCallback(
    async (newConfig: Partial<Config>) => {
      const nextConfig = { ...config, ...newConfig }
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
