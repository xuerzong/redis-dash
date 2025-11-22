import { ContextMenu as BaseContextMenu } from '@base-ui-components/react/context-menu'
import { Slot } from '@radix-ui/react-slot'
import './index.scss'

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
        <BaseContextMenu.Positioner>
          <BaseContextMenu.Popup className="ContextMenuContent">
            {menu.map((d) => (
              <BaseContextMenu.Item
                key={d.key}
                className="ContextMenuItem"
                onClick={d.onClick}
                data-color-palette={d.colorPalette}
              >
                <Slot className="ContextMenuItemIcon">{d.icon}</Slot>
                {d.label}
              </BaseContextMenu.Item>
            ))}
          </BaseContextMenu.Popup>
        </BaseContextMenu.Positioner>
      </BaseContextMenu.Portal>
    </BaseContextMenu.Root>
  )
}
