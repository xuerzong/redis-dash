import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import api from '@xuerzong/redis-dash-invoke/api'
import type { Config, Lang } from '@/types'
import { isTauri } from '@tauri-apps/api/core'
import { type } from '@tauri-apps/plugin-os'

interface ConfigContextState {
  config: Config
  monoFonts: string[]
  updateConfig: (config: Partial<Config>) => void
}

const normalizeConfig = (next: Partial<Config>, fallback: Config): Config => {
  return {
    lang: (next.lang as Lang) ?? fallback.lang,
    monoFontFamily:
      next.monoFontFamily === undefined
        ? (fallback.monoFontFamily ?? null)
        : next.monoFontFamily,
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
    monoFontFamily: null,
  })
  const [monoFonts, setMonoFonts] = useState<string[]>([])

  const lang = useMemo(() => {
    return config.lang
  }, [config])

  useEffect(() => {
    const fontFamily =
      isTauri() && config.monoFontFamily
        ? `"${config.monoFontFamily}", "Geist Mono", monospace`
        : '"Geist Mono", monospace'

    document.documentElement.style.setProperty('--font-mono', fontFamily)
  }, [config.monoFontFamily])

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

  const fetchMonoFonts = useCallback(async () => {
    if (!isTauri()) {
      setMonoFonts([])
      return
    }

    const nextFonts = await api.getMonoFonts()
    setMonoFonts(
      nextFonts
        .filter((font): font is string => typeof font === 'string')
        .map((font) => font.trim())
    )
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
    fetchMonoFonts()
  }, [fetchConfig, fetchMonoFonts])

  const value: ConfigContextState = useMemo(() => {
    return {
      config,
      monoFonts,
      updateConfig,
    }
  }, [config, monoFonts, updateConfig])

  return (
    <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>
  )
}
