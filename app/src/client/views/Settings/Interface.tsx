import { Box } from '@client/components/ui/Box'
import { FormField } from '@client/components/ui/Form'
import { FontSizeSelector } from '@client/components/FontSizeSelector'
import { MonoFontSelector } from '@client/components/MonoFontSelector'
import { useIntlContext } from '@client/providers/IntlProvider'
import { isTauri } from '@tauri-apps/api/core'

const InterfacePage = () => {
  const { formatMessage } = useIntlContext()

  return (
    <Box display="flex" flexDirection="column" gap="1rem">
      <FormField name="fontSize" label={formatMessage('fontSize')}>
        <FontSizeSelector />
      </FormField>

      {isTauri() ? (
        <FormField name="monoFont" label={formatMessage('monoFont')}>
          <MonoFontSelector />
        </FormField>
      ) : null}
    </Box>
  )
}

export default InterfacePage
