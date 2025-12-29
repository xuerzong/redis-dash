import React, { useMemo } from 'react'
import { locales } from '@client/locales'
import { useConfigContext } from './ConfigProvider'
import type { Lang } from '@/types'

interface IntlContextState {
  lang: Lang
  setLang: (lang: Lang) => void
  messages: Record<string, string>
  formatMessage: (id: string) => string
}

const IntlContext = React.createContext<IntlContextState | null>(null)
IntlContext.displayName = 'IntlContext'

export const useIntlContext = () => {
  const context = React.useContext(IntlContext)
  if (!context) {
    throw new Error(`useIntlContext must be used in <IntlProvider />`)
  }
  return context
}

export const IntlProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const { config, updateConfig } = useConfigContext()
  const messages = locales[config.lang as Lang]
  const value = useMemo(() => {
    return {
      lang: config.lang,
      setLang: (lang: Lang) => {
        updateConfig({ lang })
      },
      messages,
      formatMessage: (id: string) => {
        return messages[id] || locales['en-US'][config.lang]
      },
    }
  }, [config.lang, messages, updateConfig])
  return <IntlContext value={value}>{children}</IntlContext>
}
