import React, { useEffect, useMemo, useState } from 'react'
import { locales } from '@/client/locales'

const langs = ['zh-CN', 'en-US'] as const

export type Lang = (typeof langs)[number]

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
  const cacheLang = localStorage.getItem('rds-locale') as Lang
  const [lang, setLang] = useState<Lang>(
    langs.includes(cacheLang) ? cacheLang : 'en-US'
  )
  const messages = locales[lang]
  useEffect(() => {
    localStorage.setItem('rds-locale', lang)
  }, [lang])
  const value = useMemo(() => {
    return {
      lang,
      setLang,
      messages,
      formatMessage: (id: string) => {
        return messages[id] || locales['en-US'][lang]
      },
    }
  }, [lang, messages])
  return <IntlContext value={value}>{children}</IntlContext>
}
