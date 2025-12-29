import { useIntlContext } from '@client/providers/IntlProvider'
import { Select } from '../ui/Select'

export const LangSelector = () => {
  const { lang, setLang } = useIntlContext()
  return (
    <Select
      value={lang}
      onChange={(e) => {
        setLang(e as typeof lang)
      }}
      options={[
        {
          label: '中文',
          value: 'zh-CN',
        },
        {
          label: 'English',
          value: 'en-US',
        },
      ]}
    />
  )
}
