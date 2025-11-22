import { cn } from '@/client/utils/cn'
import './index.scss'
import { ChevronDownIcon } from 'lucide-react'

type SelectOption = {
  label: React.ReactNode
  value: string
}
interface SelectProps {
  value?: string
  options: SelectOption[]
  onChange?: (value: string, option: SelectOption) => void
  className?: string
}

export const Select: React.FC<SelectProps> = ({
  value,
  options = [],
  onChange,
  className,
}) => {
  return (
    <div className={cn('Select', className)}>
      <select
        value={value}
        className="SelectRoot"
        onChange={(e) => {
          const currentValue = e.target.value
          onChange?.(
            currentValue,
            options.find((opt) => opt.value === currentValue)!
          )
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDownIcon className="SelectIcon" />
    </div>
  )
}
