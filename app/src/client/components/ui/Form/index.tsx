import { Box, type BoxProps } from '../Box'
import './index.scss'

export const Form = () => {
  return <div></div>
}

interface FormFieldProps extends BoxProps<'div'> {
  name: string
  label: string
}

export const FormField: React.FC<React.PropsWithChildren<FormFieldProps>> = ({
  name,
  label,
  children,
  ...restProps
}) => {
  return (
    <Box as="div" className="FormField" {...restProps}>
      <label className="FormLabel" htmlFor={name}>
        {label}
      </label>
      {children}
    </Box>
  )
}
