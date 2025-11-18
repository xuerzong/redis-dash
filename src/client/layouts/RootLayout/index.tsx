import { GithubIcon, SettingsIcon } from 'lucide-react'
import { Outlet, useNavigate } from 'react-router'
import { Box } from '@/client/components/ui/Box'
import { Button, IconButton } from '@/client/components/ui/Button'
import s from './index.module.scss'

export const RootLayout = () => {
  const navigate = useNavigate()
  return (
    <Box className={s.Layout}>
      <Box as="header" className={s.Header}>
        <Box
          fontSize="1rem"
          fontWeight="bold"
          cursor="pointer"
          onClick={() => {
            navigate('/')
          }}
        >
          Redis Studio
        </Box>
        <Box display="flex" alignItems="center" gap="0.25rem" marginLeft="auto">
          <Button
            variant="outline"
            onClick={() => {
              navigate('/settings')
            }}
          >
            <SettingsIcon />
            Settings
          </Button>

          <IconButton
            variant="outline"
            onClick={() => {
              window.open('https://github.com/xuerzong/redis-studio', '_blank')
            }}
          >
            <GithubIcon />
          </IconButton>
        </Box>
      </Box>
      <Box className={s.Content}>
        <Outlet />
      </Box>
    </Box>
  )
}
