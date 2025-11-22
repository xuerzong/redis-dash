import './index.scss'

export const Form = () => {
  return <div></div>
}

interface FormFieldProps {
  name: string
  label: string
}

export const FormField: React.FC<React.PropsWithChildren<FormFieldProps>> = ({
  name,
  label,
  children,
}) => {
  return (
    <div className="FormField">
      <label className="FormLabel" htmlFor={name}>
        {label}
      </label>
      {children}
    </div>
  )
}
