import React from 'react'
import { Box } from '../Box'
import './index.scss'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (props, ref) => {
    return <Box as="input" className="InputRoot Input" {...props} ref={ref} />
  }
)

interface InputWithPrefixProps extends InputProps {
  prefixNode?: React.ReactNode
}

export const InputWithPrefix = React.forwardRef<
  HTMLInputElement,
  InputWithPrefixProps
>(({ prefixNode, ...restProps }, ref) => {
  return (
    <Box className="InputRoot InputWithPrefixRoot">
      <Box className="InputPrefix">{prefixNode}</Box>
      <input className="Input" {...restProps} ref={ref} />
    </Box>
  )
})
