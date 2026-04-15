import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import api from '@xuerzong/redis-dash-invoke/api'
import type { Config, Lang } from '@/types'
import { isTauri } from '@tauri-apps/api/core'
import { type } from '@tauri-apps/plugin-os'

interface ConfigContextState {
  config: Config
  updateConfig: (config: Partial<Config>) => void
}

const normalizeConfig = (next: Partial<Config>, fallback: Config): Config => {
  return {
    lang: (next.lang as Lang) ?? fallback.lang,
  }
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

export const ConfigProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const syncChannelRef = useRef<BroadcastChannel | null>(null)
  const [config, setConfig] = useState<Config>({
    lang: (localStorage.getItem('rds-lang') as Lang) || 'en-US',
  })

  const lang = useMemo(() => {
    return config.lang
  }, [config])

  useEffect(() => {
    document.documentElement.lang = lang
    localStorage.setItem('rds-lang', lang)
  }, [lang])

  useEffect(() => {
    let channel: BroadcastChannel | null = null
    if ('BroadcastChannel' in window) {
      channel = new BroadcastChannel('rds-config-sync')
      syncChannelRef.current = channel

      channel.onmessage = (event: MessageEvent<Partial<Config>>) => {
        if (!event.data) return
        setConfig((pre) => normalizeConfig(event.data, pre))
      }
    }

    const onStorage = (event: StorageEvent) => {
      if (event.key !== 'rds-lang') return

      setConfig((pre) =>
        normalizeConfig(
          {
            lang: (localStorage.getItem('rds-lang') as Lang) ?? pre.lang,
          },
          pre
        )
      )
    }

    window.addEventListener('storage', onStorage)

    return () => {
      window.removeEventListener('storage', onStorage)
      channel?.close()
      syncChannelRef.current = null
    }
  }, [])

  useEffect(() => {
    if (isTauri()) {
      document.documentElement.setAttribute('data-tauri', type())
    }
  }, [])

  const fetchConfig = useCallback(async () => {
    const nextConfig = await api.getSystemConfig()
    if (nextConfig) {
      setConfig((pre) => normalizeConfig(nextConfig, pre))
    }
  }, [])

  const updateConfig = useCallback(
    async (newConfig: Partial<Config>) => {
      const nextConfig = normalizeConfig(newConfig, config)
      setConfig(nextConfig)
      syncChannelRef.current?.postMessage(nextConfig)
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

  return (
    <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>
  )
}
