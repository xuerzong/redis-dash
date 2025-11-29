import { useConfigContext } from '@client/providers/ConfigProvider'
import { Radio } from '@client/components/ui/Radio'
import { useIntlContext } from '@client/providers/IntlProvider'
import type { Theme } from '@/types'

export const ThemeSwitcher = () => {
  const { config, updateConfig } = useConfigContext()
  const { formatMessage } = useIntlContext()

  const themeOptions = [
    {
      label: formatMessage('theme.system'),
      value: 'system',
    },
    {
      label: formatMessage('theme.dark'),
      value: 'dark',
    },
    {
      label: formatMessage('theme.light'),
      value: 'light',
    },
  ]
  return (
    <Radio
      value={config.theme}
      onValueChange={(e) => {
        updateConfig({ theme: e as Theme })
      }}
      options={themeOptions}
    />
  )
}
