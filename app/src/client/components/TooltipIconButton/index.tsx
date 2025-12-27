import { IconButton, type ButtonProps } from '../ui/Button'
import { Tooltip, type TooltipProps } from '../ui/Tooltip'
import s from './index.module.scss'

interface TooltipIconButtonProps
  extends Pick<TooltipProps, 'content'>,
    Omit<ButtonProps, 'content'> {}

export const TooltipIconButton: React.FC<TooltipIconButtonProps> = ({
  content,
  ...restProps
}) => {
  return (
    <Tooltip className={s.Tooltip} content={content}>
      <IconButton {...restProps} />
    </Tooltip>
  )
}
