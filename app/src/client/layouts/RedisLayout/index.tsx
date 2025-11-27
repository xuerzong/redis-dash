import { useEffect, useRef, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router'
import { useRedisId } from '@/client/hooks/useRedisId'
import { useAppStore } from '@/client/stores/appStore'
import { Box } from '@/client/components/ui/Box'
import { Tooltip } from '@/client/components/ui/Tooltip'
import { Button, IconButton } from '@/client/components/ui/Button'
import {
  ChevronLeftIcon,
  MoreHorizontalIcon,
  PlusIcon,
  RefreshCcwIcon,
  SettingsIcon,
  TerminalIcon,
  TrashIcon,
  XIcon,
} from 'lucide-react'
import { useIntlContext } from '@/client/providers/IntlProvider'
import { RedisProvider, useRedisContext } from '@/client/providers/RedisContext'
import { DropdownMenu } from '@/client/components/ui/DropdownMenu'
import { RedisConnectionDeleteModal } from '@/client/components/Redis/RedisConnectionDeleteModal'
import {
  getConnectionStatus,
  postDisconnectConnection,
} from '@/client/commands/api/connections'
import { Loader } from '@/client/components/Loader'
import s from './index.module.scss'

export const RedisLayoutComponent: React.FC = () => {
  const redisId = useRedisId()
  const connections = useAppStore((state) => state.connections)
  const navigate = useNavigate()
  const location = useLocation()
  const pathname = location.pathname
  const { setSelectedKey } = useRedisContext()
  const { formatMessage } = useIntlContext()
  const [delOpen, setDelOpen] = useState(false)

  useEffect(() => {
    if (
      redisId &&
      connections.length &&
      !connections.find((d) => d.id === redisId)
    ) {
      navigate(`/${connections[0].id}`)
    }
  }, [redisId, connections])

  return (
    <>
      <Box display="flex" flexDirection="column" height="100%">
        <Box
          display="flex"
          alignItems="center"
          borderBottom="1px solid var(--border-color)"
          height="2.5rem"
          boxSizing="content-box"
          flexShrink={0}
        >
          {Boolean(pathname.replace(`/${redisId}`, '')) && (
            <Button
              variant="ghost"
              onClick={() => {
                navigate(`/${redisId}`, { replace: true })
              }}
            >
              <ChevronLeftIcon />
              {formatMessage('back')}
            </Button>
          )}
          <Box
            style={
              {
                '--border-radius': 0,
              } as any
            }
            display="flex"
            alignItems="center"
            marginLeft="auto"
            flexShrink={0}
            className={s.Actions}
          >
            <Tooltip content={formatMessage('reconnect')}>
              <IconButton
                variant="outline"
                onClick={async () => {
                  await postDisconnectConnection(redisId)
                  window.location.reload()
                }}
              >
                <RefreshCcwIcon />
              </IconButton>
            </Tooltip>
            <Tooltip content={formatMessage('terminal')}>
              <IconButton
                variant="outline"
                onClick={() => {
                  navigate(`/${redisId}/terminal`)
                }}
              >
                <TerminalIcon />
              </IconButton>
            </Tooltip>

            <Tooltip content={formatMessage('key.add')}>
              <IconButton
                variant="outline"
                onClick={() => {
                  setSelectedKey('')
                }}
              >
                <PlusIcon />
              </IconButton>
            </Tooltip>

            <DropdownMenu
              menu={[
                {
                  label: formatMessage('settings'),
                  key: 'settings',
                  icon: <SettingsIcon />,
                  onClick() {
                    navigate(`/${redisId}/settings`)
                  },
                },
                {
                  label: formatMessage('delete'),
                  key: 'delete',
                  icon: <TrashIcon />,
                  onClick() {
                    setDelOpen(true)
                  },
                },
              ]}
            >
              <IconButton variant="outline">
                <MoreHorizontalIcon />
              </IconButton>
            </DropdownMenu>
          </Box>
        </Box>
        <Box flex={1} height="calc(100% - 2.5rem)">
          <Outlet />
        </Box>
      </Box>

      <RedisConnectionDeleteModal
        redisId={redisId}
        open={delOpen}
        onOpenChange={setDelOpen}
      />
    </>
  )
}

const ConnectRedisLoader: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const redisId = useRedisId()
  const [status, setStatus] = useState(0)
  const [error, setError] = useState(false)
  const retryTimeRef = useRef(10)
  const retryTimerRef = useRef<any>(null)

  const queryConnectionStatus = async (id: string) => {
    retryTimeRef.current = retryTimeRef.current - 1
    return getConnectionStatus(id).then((res) => {
      if (res !== 1) {
        if (retryTimeRef.current > 0) {
          retryTimerRef.current = setTimeout(() => {
            queryConnectionStatus(id)
          }, 1000)
        } else {
          setError(true)
        }
      }
      setStatus(res)
    })
  }

  useEffect(() => {
    setStatus(0)
    setError(false)
    retryTimeRef.current = 10
  }, [redisId])

  useEffect(() => {
    queryConnectionStatus(redisId)
    return () => {
      clearTimeout(retryTimerRef.current)
    }
  }, [redisId])

  if (error)
    return (
      <Box
        width="100%"
        height="100%"
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        gap="var(--spacing-md)"
      >
        <XIcon style={{ width: '1.5rem', height: '1.5rem' }} />
        Connect Redis Failed
      </Box>
    )

  return (
    <>
      {status === 1 ? (
        children
      ) : (
        <Box
          width="100%"
          height="100%"
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          gap="var(--spacing-md)"
        >
          <Loader />
          <Box>Connecting</Box>
        </Box>
      )}
    </>
  )
}

export const RedisLayout = () => {
  return (
    <ConnectRedisLoader>
      <RedisProvider>
        <RedisLayoutComponent />
      </RedisProvider>
    </ConnectRedisLoader>
  )
}
