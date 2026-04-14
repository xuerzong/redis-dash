import { useConfigContext } from '@client/providers/ConfigProvider'
import { Select } from '@client/components/ui/Select'
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
      label: formatMessage('theme.githubLight'),
      value: 'github-light',
    },
    {
      label: formatMessage('theme.githubDark'),
      value: 'github-dark',
    },
    {
      label: formatMessage('theme.catppuccinMocha'),
      value: 'catppuccin-mocha',
    },
    {
      label: formatMessage('theme.dracula'),
      value: 'dracula',
    },
  ]
  return (
    <Select
      value={config.theme}
      onChange={(value) => {
        updateConfig({ theme: value as Theme })
      }}
      options={themeOptions}
    />
  )
}
