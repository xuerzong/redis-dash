import { ContextMenu as BaseContextMenu } from '@base-ui-components/react/context-menu'
import { Slot } from '@radix-ui/react-slot'
import './index.scss'
import { Box } from '../Box'

export type ContextMenuItemProps = {
  key: string
  label: string
  icon: React.ReactNode
  onClick?: () => void
  colorPalette?: 'success' | 'warning' | 'danger'
}

interface ContextMenuProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  menu: ContextMenuItemProps[]
}

export const ContextMenu: React.FC<
  React.PropsWithChildren<ContextMenuProps>
> = ({ children, menu, open, onOpenChange }) => {
  return (
    <BaseContextMenu.Root open={open} onOpenChange={onOpenChange}>
      <BaseContextMenu.Trigger className="ContextMenuTrigger">
        {children}
      </BaseContextMenu.Trigger>

      <BaseContextMenu.Portal>
        <BaseContextMenu.Positioner className="ContextMenuPositioner">
          <BaseContextMenu.Popup className="ContextMenuContent">
            {menu.map((d) => (
              <Box asChild key={d.key} as="div" colorPalette={d.colorPalette}>
                <BaseContextMenu.Item
                  className="ContextMenuItem"
                  onClick={d.onClick}
                >
                  <Slot className="ContextMenuItemIcon">{d.icon}</Slot>
                  {d.label}
                </BaseContextMenu.Item>
              </Box>
            ))}
          </BaseContextMenu.Popup>
        </BaseContextMenu.Positioner>
      </BaseContextMenu.Portal>
    </BaseContextMenu.Root>
  )
}
