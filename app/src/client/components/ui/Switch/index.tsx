import { Switch as BaseSwitch } from '@base-ui-components/react/switch'
import './index.scss'

interface SwitchProps {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

export const Switch: React.FC<SwitchProps> = (props) => {
  return (
    <BaseSwitch.Root {...props} defaultChecked className="Switch">
      <BaseSwitch.Thumb className="Thumb" />
    </BaseSwitch.Root>
  )
}
