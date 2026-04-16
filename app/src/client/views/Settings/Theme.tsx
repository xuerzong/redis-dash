import { Box } from '@client/components/ui/Box'
import { FormField } from '@client/components/ui/Form'
import { ThemeSwitcher } from '@client/components/ThemeSwitcher'
import { useIntlContext } from '@client/providers/IntlProvider'

const ThemePage = () => {
  const { formatMessage } = useIntlContext()

  return (
    <Box display="flex" flexDirection="column" gap="1rem">
      <FormField name="theme" label={formatMessage('theme')}>
        <ThemeSwitcher />
      </FormField>
    </Box>
  )
}

export default ThemePage
