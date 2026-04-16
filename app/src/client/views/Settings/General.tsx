import { Box } from '@client/components/ui/Box'
import { FormField } from '@client/components/ui/Form'
import { LangSelector } from '@client/components/LangSelector'
import { useIntlContext } from '@client/providers/IntlProvider'

const GeneralPage = () => {
  const { formatMessage } = useIntlContext()

  return (
    <Box display="flex" flexDirection="column" gap="1rem">
      <FormField name="language" label={formatMessage('language')}>
        <LangSelector />
      </FormField>
    </Box>
  )
}

export default GeneralPage
