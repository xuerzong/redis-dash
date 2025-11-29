import { Radio as BaseRadio } from '@base-ui-components/react/radio'
import { RadioGroup as BaseRadioGroup } from '@base-ui-components/react/radio-group'
import './index.scss'

export type RadioOption = {
  value: string
  label: React.ReactNode
}

export interface RadioProps {
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  options: RadioOption[]
}

export const Radio: React.FC<RadioProps> = ({
  value,
  onValueChange,
  options,
}) => {
  return (
    <BaseRadioGroup
      value={value}
      onValueChange={(e) => {
        onValueChange?.(e as string)
      }}
      className="RadioGroup"
    >
      {options.map((op) => (
        <label key={op.value} className="RadioItem">
          <BaseRadio.Root className="RadioRoot" value={op.value}>
            <BaseRadio.Indicator className="RadioIndicator" />
          </BaseRadio.Root>
          {op.label}
        </label>
      ))}
    </BaseRadioGroup>
  )
}
