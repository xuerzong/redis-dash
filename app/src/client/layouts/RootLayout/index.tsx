import { Outlet, useNavigate } from 'react-router'
import { DatabaseIcon, SettingsIcon } from 'lucide-react'
import { Box } from '@client/components/ui/Box'
import { IconButton } from '@/client/components/ui/Button'
import { GithubIcon } from '@/client/components/Icons/GithubIcon'
import { Tooltip } from '@/client/components/ui/Tooltip'
import { useIntlContext } from '@/client/providers/IntlProvider'
import s from './index.module.scss'

export const RootLayout = () => {
  const navigate = useNavigate()
  const { formatMessage } = useIntlContext()
  return (
    <Box className={s.RootLayout} display="flex" height="100vh">
      <Box
        display="flex"
        flexDirection="column"
        flexShrink={0}
        width="calc(var(--sider-size) + 1px)"
        height="100%"
        borderRight="1px solid var(--border-color)"
        className={s.RootMenu}
      >
        <IconButton
          variant="ghost"
          onClick={() => {
            navigate('/')
          }}
        >
          <DatabaseIcon />
        </IconButton>
        <Box flex={1} />
        <Tooltip content={formatMessage('settings')} placement="right">
          <IconButton
            variant="ghost"
            onClick={() => {
              navigate('/settings')
            }}
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
  )
}
