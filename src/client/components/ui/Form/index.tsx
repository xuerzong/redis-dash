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
    <div className="form_field">
      <label className="form_label" htmlFor={name}>
        {label}
      </label>
      {children}
    </div>
  )
}
