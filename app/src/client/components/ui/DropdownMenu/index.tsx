import * as RadixDropdownMenu from '@radix-ui/react-dropdown-menu'
import { Slot } from '@radix-ui/react-slot'
import './index.scss'

interface DropdownMenuProps {
  menu?: {
    label: string
    key: string
    icon: React.ReactNode
    onClick?: () => void
  }[]
}

export const DropdownMenu: React.FC<
  React.PropsWithChildren<DropdownMenuProps>
> = ({ children, menu = [] }) => {
  return (
    <RadixDropdownMenu.Root>
      <RadixDropdownMenu.Trigger asChild>{children}</RadixDropdownMenu.Trigger>

      <RadixDropdownMenu.Portal>
        <RadixDropdownMenu.Content className="DropdownMenuContent">
          {menu.map((d) => (
            <RadixDropdownMenu.Item
              key={d.key}
              className="DropdownMenuItem"
              onClick={d.onClick}
            >
              <Slot className="DropdownMenuItemIcon">{d.icon}</Slot>
              {d.label}
            </RadixDropdownMenu.Item>
          ))}

          <RadixDropdownMenu.Arrow />
        </RadixDropdownMenu.Content>
      </RadixDropdownMenu.Portal>
    </RadixDropdownMenu.Root>
  )
}
