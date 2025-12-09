import * as RadixTooltip from '@radix-ui/react-tooltip'
import './index.scss'

interface TooltipProps {
  content: React.ReactNode
  placement?: RadixTooltip.TooltipContentProps['side']
}

export const Tooltip: React.FC<React.PropsWithChildren<TooltipProps>> = ({
  children,
  content,
  placement,
}) => {
  return (
    <RadixTooltip.Provider>
      <RadixTooltip.Root delayDuration={300}>
        <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
        <RadixTooltip.Portal>
          <RadixTooltip.Content className="TooltipContent" side={placement}>
            <RadixTooltip.Arrow className="TooltipArrow" />
            <div className="TooltipWrapper">{content}</div>
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  )
}
