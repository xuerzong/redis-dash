import { useMemo } from 'react'
import { Select } from '@client/components/ui/Select'
import { useConfigContext } from '@client/providers/ConfigProvider'

const MIN_FONT_SIZE = 10
const MAX_FONT_SIZE = 32

export const FontSizeSelector = () => {
  const { config, updateConfig } = useConfigContext()

  const options = useMemo(() => {
    const next = [] as { label: string; value: string }[]
    for (let size = MIN_FONT_SIZE; size <= MAX_FONT_SIZE; size += 1) {
      next.push({
        label: `${size}px`,
        value: String(size),
      })
    }
    return next
  }, [])

  const current = Math.min(
    MAX_FONT_SIZE,
    Math.max(MIN_FONT_SIZE, Number(config.fontSize ?? 14))
  )

  return (
    <Select
      value={String(current)}
      onChange={(value) => {
        updateConfig({ fontSize: Number(value) })
      }}
      options={options}
    />
  )
}
