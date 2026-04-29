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
  minWidth?: string
  minHeight?: string
  className?: string
}

export const Modal: React.FC<React.PropsWithChildren<ModalProps>> = ({
  title,
  description,
  open,
  onOpenChange,
  trigger,
  children,
  footer,
  minWidth,
  minHeight,
  className,
}) => {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <Dialog.Trigger>{trigger}</Dialog.Trigger>}
      <Dialog.Portal className={className}>
        <Dialog.Backdrop className="ModalBackdrop" />
        <Dialog.Popup
          className="ModalContent"
          style={{
            minWidth: minWidth
              ? `min(${minWidth}, calc(100vw - 2rem))`
              : undefined,
            minHeight: minHeight ? `min(${minHeight}, 85vh)` : undefined,
          }}
        >
          <div className="ModalHeader">
            <Dialog.Title className="ModalTitle">{title}</Dialog.Title>
            <Dialog.Description className="ModalDescription">
              {description}
            </Dialog.Description>

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
