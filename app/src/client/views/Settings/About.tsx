import { Box } from '@client/components/ui/Box'
import { FormField } from '@client/components/ui/Form'
import { useIntlContext } from '@client/providers/IntlProvider'
import { useEffect, useState } from 'react'
import { isTauri } from '@tauri-apps/api/core'

const AboutPage = () => {
  const { formatMessage } = useIntlContext()
  const [version, setVersion] = useState('')

  useEffect(() => {
    if (isTauri()) {
      import('@tauri-apps/api/app').then((mod) => {
        mod.getVersion().then(setVersion)
      })
    }
  }, [])

  return (
    <Box display="flex" flexDirection="column" gap="1rem">
      {version && (
        <FormField name="version" label={formatMessage('settings.version')}>
          <Box fontSize="0.875rem">{version}</Box>
        </FormField>
      )}
    </Box>
  )
}

export default AboutPage
