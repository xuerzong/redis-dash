import { Select } from '@client/components/ui/Select'
import { useIntlContext } from '@client/providers/IntlProvider'
import { useThemeContext } from '@client/providers/ThemeProvider'
import type { ThemeMode } from '@/types'

const previewColors = (theme: ReturnType<typeof useThemeContext>['theme']) => {
  return [
    theme.baseColors.background,
    theme.baseColors.foreground,
    theme.baseColors.primary,
    theme.baseColors.accent,

    theme.tagColors.string,
    theme.tagColors.set,
    theme.tagColors.hash,
    theme.tagColors.list,
    theme.tagColors.zset,
    theme.tagColors.stream,
  ]
}

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
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          flexWrap: 'wrap',
        }}
      >
        {previewColors(theme).map((color, index) => (
          <span
            key={`${theme.id}-${color}-${index}`}
            style={{
              width: '0.9rem',
              height: '0.9rem',
              borderRadius: '999px',
              backgroundColor: `rgb(${color})`,
              border: '1px solid rgb(var(--color-border))',
              boxShadow: '0 0 0 1px rgb(var(--color-background)) inset',
            }}
          />
        ))}
      </div>
    </div>
  )
}
