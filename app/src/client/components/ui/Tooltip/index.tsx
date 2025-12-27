import * as RadixTooltip from '@radix-ui/react-tooltip'
import { cn } from '@client/utils/cn'
import './index.scss'

export interface TooltipProps {
  className?: string
  content: React.ReactNode
  placement?: RadixTooltip.TooltipContentProps['side']
}

export const Tooltip: React.FC<React.PropsWithChildren<TooltipProps>> = ({
  className,
  children,
  content,
  placement,
}) => {
  return (
    <RadixTooltip.Provider>
      <RadixTooltip.Root delayDuration={300}>
        <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
        <RadixTooltip.Portal>
          <RadixTooltip.Content
            className={cn('TooltipContent', className)}
            side={placement}
          >
            <RadixTooltip.Arrow className="TooltipArrow" />
            <div className="TooltipWrapper">{content}</div>
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  )
}
