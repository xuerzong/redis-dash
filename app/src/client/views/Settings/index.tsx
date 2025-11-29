import { LangSelector } from '@/client/components/LangSelector'
import { ThemeSwitcher } from '@/client/components/ThemeSwitcher'
import { Box } from '@/client/components/ui/Box'
import { FormField } from '@/client/components/ui/Form'
import { useIntlContext } from '@/client/providers/IntlProvider'

const Page = () => {
  const { formatMessage } = useIntlContext()
  return (
    <Box maxWidth="32rem" margin="0 auto" padding="var(--spacing-md)">
      <Box display="flex" flexDirection="column" gap="1rem">
        <FormField name="language" label={formatMessage('language')}>
          <LangSelector />
        </FormField>

        <FormField name="theme" label={formatMessage('theme')}>
          <ThemeSwitcher />
        </FormField>
      </Box>
    </Box>
  )
}

export default Page
