import { Outlet, useNavigate } from 'react-router'
import { DatabaseIcon, SettingsIcon } from 'lucide-react'
import { Box } from '@client/components/ui/Box'
import { IconButton } from '@client/components/ui/Button'
import { GithubIcon } from '@client/components/Icons/GithubIcon'
import { Tooltip } from '@client/components/ui/Tooltip'
import { useIntlContext } from '@client/providers/IntlProvider'
import { useCallback } from 'react'
import { useRedisId } from '@client/hooks/useRedisId'
import {
  changeConnectionsCollapsed,
  useAppStore,
} from '@client/stores/appStore'
import { TitlebarHeightSetter } from '@client/components/tauri/TitlebarHeightSetter'
import { isTauri } from '@tauri-apps/api/core'
import {
  WebviewWindow,
  getAllWebviewWindows,
} from '@tauri-apps/api/webviewWindow'
import s from './index.module.scss'

export const RootLayout = () => {
  const redisId = useRedisId()
  const selectedRedisId = useAppStore((state) => state.selectedRedisId)
  const navigate = useNavigate()
  const { formatMessage } = useIntlContext()

  const openSettingsWindow = useCallback(async () => {
    try {
      if (!isTauri()) {
        navigate('/settings')
        return
      }

      const windows = await getAllWebviewWindows()
      const existing = windows.find((w) => w.label === 'settings')
      if (existing) {
        await existing.show()
        await existing.setFocus()
        return
      }

      const settingsWindow = new WebviewWindow('settings', {
        title: 'Redis Dash Settings',
        url: '/#/settings',
        width: 720,
        height: 560,
        minWidth: 560,
        minHeight: 420,
        center: true,
        resizable: true,
        titleBarStyle: 'overlay',
        hiddenTitle: true,
      })

      settingsWindow.once('tauri://error', (e) => {
        console.error('Failed to open settings window', e)
        navigate('/settings')
      })
    } catch (error) {
      console.error('Failed to open settings window', error)
      navigate('/settings')
    }
  }, [navigate])

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
            variant="subtle"
            onClick={() => {
              if (redisId) {
                changeConnectionsCollapsed(false)
              } else {
                if (selectedRedisId) {
                  navigate(`/${selectedRedisId}`)
                } else {
                  changeConnectionsCollapsed(false)
                  navigate('/')
                }
              }
            }}
            data-active
          >
            <DatabaseIcon />
          </IconButton>
          <Box flex={1} />
          <Tooltip content={formatMessage('settings')} placement="right">
            <IconButton
              variant="ghost"
              onClick={openSettingsWindow}
              className={s.RootMenuButton}
            >
              <SettingsIcon />
            </IconButton>
          </Tooltip>

          <IconButton
            variant="ghost"
            onClick={() => {
              window.open('https://github.com/xuerzong/redis-dash', '_blank')
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
