import { Select } from '@client/components/ui/Select'
import { useIntlContext } from '@client/providers/IntlProvider'
import { useThemeContext } from '@client/providers/ThemeProvider'
import type { ThemeMode } from '@/types'

export const ThemeSwitcher = () => {
  const { mode, setMode, theme, themes, setThemeId } = useThemeContext()
  const { formatMessage } = useIntlContext()

  const modeOptions = [
    {
      label: formatMessage('theme.system'),
      value: 'system',
    },
    {
      label: formatMessage('theme.light'),
      value: 'light',
    },
    {
      label: formatMessage('theme.dark'),
      value: 'dark',
    },
  ]

  const themeOptions = themes.map((item) => ({
    label: item.name,
    value: item.id,
  }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <Select
        value={mode}
        onChange={(value) => {
          setMode(value as ThemeMode)
        }}
        options={modeOptions}
      />
      <Select
        value={theme.id}
        onChange={(value) => {
          setThemeId(String(value))
        }}
        options={themeOptions}
      />
    </div>
  )
}
