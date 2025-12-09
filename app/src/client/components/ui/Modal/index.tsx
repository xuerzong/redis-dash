import { Dialog } from '@base-ui-components/react/dialog'
import './index.scss'
import { IconButton } from '../Button'
import { XIcon } from 'lucide-react'

interface ModalProps {
  title?: string
  description?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactNode
  footer?: React.ReactNode
}

export const Modal: React.FC<React.PropsWithChildren<ModalProps>> = ({
  title,
  description,
  open,
  onOpenChange,
  trigger,
  children,
  footer,
}) => {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <Dialog.Trigger>{trigger}</Dialog.Trigger>}
      <Dialog.Portal>
        <Dialog.Backdrop className="ModalBackdrop" />
        <Dialog.Popup style={{ width: '90vw' }} className="ModalContent">
          <div className="ModalHeader">
            <Dialog.Title className="ModalTitle">{title}</Dialog.Title>
            {description && (
              <Dialog.Description className="ModalDescription">
                {description}
              </Dialog.Description>
            )}

            <IconButton
              variant="ghost"
              className="ModalCloseIcon"
              onClick={() => {
                onOpenChange?.(false)
              }}
            >
              <XIcon />
            </IconButton>
          </div>
          {children && <div className="ModalWrapper">{children}</div>}
          {footer}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
