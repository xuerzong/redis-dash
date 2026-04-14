import { Outlet } from 'react-router'
import { Box } from '@client/components/ui/Box'
import { useIntlContext } from '@client/providers/IntlProvider'
import { TitlebarHeightSetter } from '@client/components/tauri/TitlebarHeightSetter'
import { isTauri } from '@tauri-apps/api/core'

export const SettingsLayout: React.FC = () => {
  const { formatMessage } = useIntlContext()
  const inTauri = isTauri()

  return (
    <Box display="flex" flexDirection="column" height="100%">
      {inTauri && <TitlebarHeightSetter />}
      {inTauri && (
        <Box
          display="flex"
          alignItems="center"
          height="var(--titlebar-height)"
          borderBottom="1px solid var(--border-color)"
          boxSizing="border-box"
        >
          <Box
            flex={1}
            width="100%"
            height="100%"
            display="flex"
            alignItems="center"
            justifyContent="center"
            paddingLeft="0.75rem"
            fontSize="0.875rem"
            textAlign="center"
            data-tauri-drag-region
          >
            {formatMessage('settings')}
          </Box>
        </Box>
      )}
      <Box
        flex={1}
        height={inTauri ? 'calc(100vh - var(--titlebar-height))' : '100%'}
      >
        <Outlet />
      </Box>
    </Box>
  )
}
