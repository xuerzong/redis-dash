import React from 'react'
import { cn } from '@/client/utils/cn'
import './index.scss'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'subtle'
  loading?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, loading, ...restProps }, ref) => {
    return (
      <button
        className={cn('Button', className)}
        {...restProps}
        data-variant={variant}
        data-loading={loading}
        ref={ref}
      />
    )
  }
)

export const IconButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (props, ref) => {
    return <Button {...props} data-type="icon" ref={ref} />
  }
)
