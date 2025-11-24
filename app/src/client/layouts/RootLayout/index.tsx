import { GithubIcon, SettingsIcon } from 'lucide-react'
import { Outlet, useNavigate } from 'react-router'
import { Box } from '@client/components/ui/Box'
import { Button, IconButton } from '@client/components/ui/Button'
import s from './index.module.scss'
import { useIntlContext } from '@/client/providers/IntlProvider'
import { Select } from '@/client/components/ui/Select'
import { LangSelector } from '@/client/components/LangSelector'

export const RootLayout = () => {
  const navigate = useNavigate()
  const { messages } = useIntlContext()
  return (
    <>
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
          <LangSelector />
          <Button
            variant="outline"
            onClick={() => {
              navigate('/settings')
            }}
          >
            <SettingsIcon />
            {messages['settings']}
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
    </>
  )
}
