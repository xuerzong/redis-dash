import { Outlet, useNavigate } from 'react-router'
import { Box } from '@client/components/ui/Box'
import { IconButton } from '@client/components/ui/Button'
import { LangSelector } from '@/client/components/LangSelector'
import { GithubIcon } from '@/client/components/Icons/GithubIcon'
import s from './index.module.scss'

export const RootLayout = () => {
  const navigate = useNavigate()
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
