import * as RadixTooltip from '@radix-ui/react-tooltip'
import './index.scss'

interface TooltipProps {
  content: React.ReactNode
}

export const Tooltip: React.FC<React.PropsWithChildren<TooltipProps>> = ({
  children,
  content,
}) => {
  return (
    <RadixTooltip.Provider>
      <RadixTooltip.Root>
        <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
        <RadixTooltip.Portal>
          <RadixTooltip.Content>
            <RadixTooltip.Arrow className="TooltipArrow" />
            <div className="TooltipWrapper">{content}</div>
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  )
}
