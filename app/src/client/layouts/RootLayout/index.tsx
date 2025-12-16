import { Outlet, useLocation, useNavigate } from 'react-router'
import { DatabaseIcon, SettingsIcon } from 'lucide-react'
import { Box } from '@rds/style'
import { IconButton } from '@client/components/ui/Button'
import { GithubIcon } from '@client/components/Icons/GithubIcon'
import { Tooltip } from '@client/components/ui/Tooltip'
import { useIntlContext } from '@client/providers/IntlProvider'
import { useMemo } from 'react'
import { useRedisId } from '@client/hooks/useRedisId'
import { changeConnectionsCollapsed } from '@client/stores/appStore'
import { TitlebarHeightSetter } from '@client/components/tauri/TitlebarHeightSetter'
import s from './index.module.scss'

export const RootLayout = () => {
  const redisId = useRedisId()
  const navigate = useNavigate()
  const location = useLocation()
  const pathname = useMemo(() => {
    if (location.pathname.startsWith('/settings')) {
      return location.pathname
    }
    return '/'
  }, [location])
  const { formatMessage } = useIntlContext()
  return (
    <Box className={s.RootLayout}>
      <TitlebarHeightSetter />
      <Box
        position="relative"
        height="var(--titlebar-height)"
        overflow="hidden"
        data-tauri-drag-region
      >
        <Box
          position="absolute"
          width="100%"
          bottom={0}
          height="1px"
          backgroundColor="var(--border-color)"
        />
      </Box>
      <Box display="flex" height="calc(100vh - var(--titlebar-height))">
        <Outlet />
      </Box>
    </Box>
  )
}
