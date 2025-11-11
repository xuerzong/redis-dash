import * as RadixContextMenu from '@radix-ui/react-context-menu'
import { TrashIcon } from 'lucide-react'
import './index.scss'

export const ContextMenu: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  return (
    <RadixContextMenu.Root>
      <RadixContextMenu.Trigger>{children}</RadixContextMenu.Trigger>

      <RadixContextMenu.Portal>
        <RadixContextMenu.Content className="ContextMenuContent">
          <RadixContextMenu.Item className="ContextMenuItem">
            <TrashIcon className="ContextMenuItemIcon" />
            Delete
          </RadixContextMenu.Item>
        </RadixContextMenu.Content>
      </RadixContextMenu.Portal>
    </RadixContextMenu.Root>
  )
}
