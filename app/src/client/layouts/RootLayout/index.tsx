import { Outlet, useLocation, useNavigate } from 'react-router'
import { DatabaseIcon, SettingsIcon } from 'lucide-react'
import { Box } from '@client/components/ui/Box'
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
        <Box
          display="flex"
          flexDirection="column"
          flexShrink={0}
          width="calc(var(--sider-size) + 1px)"
          height="100%"
          borderRight="1px solid var(--border-color)"
          className={s.RootMenu}
          data-tauri-drag-region
        >
          <IconButton
            variant={pathname === '/' ? 'subtle' : 'ghost'}
            onClick={() => {
              if (redisId) {
                changeConnectionsCollapsed(false)
              } else {
                navigate('/')
              }
            }}
            data-active={pathname === '/'}
          >
            <DatabaseIcon />
          </IconButton>
          <Box flex={1} />
          <Tooltip content={formatMessage('settings')} placement="right">
            <IconButton
              variant={pathname === '/settings' ? 'subtle' : 'ghost'}
              onClick={() => {
                navigate('/settings')
              }}
              className={s.RootMenuButton}
              data-active={pathname === '/settings'}
            >
              <SettingsIcon />
            </IconButton>
          </Tooltip>

          <IconButton
            variant="ghost"
            onClick={() => {
              window.open('https://github.com/xuerzong/redis-studio', '_blank')
            }}
          >
            <GithubIcon />
          </IconButton>
        </Box>
        <Box width="calc(100vw - var(--sider-size) - 1px)" height="100%">
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}
