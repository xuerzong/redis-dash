import { Select } from '@client/components/ui/Select'
import { useConfigContext } from '@client/providers/ConfigProvider'
import { useMemo } from 'react'

export const MonoFontSelector = () => {
  const { config, monoFonts, updateConfig } = useConfigContext()

  const options = useMemo(() => {
    return [
      { label: 'Geist Mono', value: '' },
      ...monoFonts
        .filter((font) => font !== 'Geist Mono')
        .map((font) => ({ label: font, value: font })),
    ]
  }, [monoFonts])

  return (
    <Select
      value={config.monoFontFamily ?? ''}
      onChange={(value) => {
        const nextValue = String(value)
        updateConfig({ monoFontFamily: nextValue || null })
      }}
      options={options}
    />
  )
}
