import {
  MoreHorizontalIcon,
  PlusIcon,
  RefreshCcwIcon,
  SettingsIcon,
  TrashIcon,
  XIcon,
} from 'lucide-react'
import { useNavigate } from 'react-router'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { Box } from '@/client/components/ui/Box'
import { keysToTree } from '@/client/utils/tree'
import { IconButton } from '@/client/components/ui/Button'
import { RedisKeysTree } from '@/client/components/Redis/RedisKeysTree'
import { Tooltip } from '@/client/components/ui/Tooltip'
import { RedisKeyViewer } from '@/client/components/Redis/RedisKeyViewer'
import { Loader } from '@/client/components/Loader'
import { RedisKeyCreateForm } from '@/client/components/RedisKeyForm'
import { RedisKeySearchInput } from '@/client/components/Redis/RedisKeySearchInput'
import { RedisConnectionDeleteModal } from '@/client/components/Redis/RedisConnectionDeleteModal'
import {
  changeKeysCountLimit,
  changeRedisId,
  changeSelectedKey,
  queryRedisKeys,
  queryRedisViewerState,
  useRedisStore,
} from '@/client/stores/redisStore'
import { DropdownMenu } from '@/client/components/ui/DropdownMenu'
import { useRedisId } from '@/client/hooks/useRedisId'
import { Select } from '@/client/components/ui/Select'
import { getConnectionStatus } from '@/client/commands/api/connections'
import s from './index.module.scss'

const Page = () => {
  const redisId = useRedisId()
  const navigate = useNavigate()
  const [delOpen, setDelOpen] = useState(false)
  const keysState = useRedisStore((state) => state.keysState)
  const viewerState = useRedisStore((state) => state.viewerState)
  const selectedKey = useRedisStore((state) => state.selectedKey)
  const filterType = useRedisStore((state) => state.filterType)
  const keysCountLimit = useRedisStore((state) => state.keysCountLimit)
  const keysTree = useMemo(
    () =>
      keysToTree(
        (keysState.data || [])
          .filter((key) => filterType === 'all' || key.type === filterType)
          .map((key) => key.key)
      ),
    [keysState, filterType]
  )

  useEffect(() => {
    changeRedisId(redisId)
  }, [redisId])

  return (
    <Box height="100%" display="flex" flexDirection="column">
      <Box
        display="flex"
        alignItems="center"
        borderBottom="1px solid var(--border-color)"
        height="2.5rem"
        boxSizing="content-box"
      >
        <RedisKeySearchInput />

        <Box
          display="flex"
          alignItems="center"
          marginLeft="auto"
          borderLeft="1px solid var(--border-color)"
          paddingLeft="var(--spacing-md)"
          flexShrink={0}
        >
          <Box fontSize="0.875rem" userSelect="none">
            COUNT
          </Box>
          <Select
            className={s.PageSizeSelector}
            options={[
              { label: '100', value: '100' },
              { label: '200', value: '200' },
              { label: '500', value: '500' },
            ]}
            value={keysCountLimit.toString()}
            onChange={(e) => {
              changeKeysCountLimit(Number(e))
            }}
          />
        </Box>
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
        >
          {/* <Tooltip content="Terminal">
            <IconButton variant="ghost">
              <TerminalIcon />
            </IconButton>
          </Tooltip> */}

          <Tooltip content="Add Key">
            <IconButton
              variant="ghost"
              onClick={() => {
                changeSelectedKey('')
              }}
            >
              <PlusIcon />
            </IconButton>
          </Tooltip>

          <DropdownMenu
            menu={[
              {
                label: 'Settings',
                key: 'Settings',
                icon: <SettingsIcon />,
                onClick() {
                  navigate(`/${redisId}/settings`)
                },
              },
              {
                label: 'Delete',
                key: 'Delete',
                icon: <TrashIcon />,
                onClick() {
                  setDelOpen(true)
                },
              },
            ]}
          >
            <IconButton variant="ghost">
              <MoreHorizontalIcon />
            </IconButton>
          </DropdownMenu>
        </Box>
      </Box>

      <PanelGroup style={{ flex: 1 }} direction="horizontal">
        <Panel
          defaultSize={50}
          minSize={30}
          style={{
            position: 'relative',
            borderRight: '1px solid var(--border-color)',
          }}
        >
          <Box position="relative" overflowY="auto" height="100%">
            <Box
              position="sticky"
              top={0}
              display="flex"
              alignItems="center"
              backgroundColor="var(--background-color)"
              borderBottom="1px solid var(--border-color)"
              zIndex={1}
              style={
                {
                  '--border-radius': 0,
                } as any
              }
            >
              <Box display="flex" alignItems="center">
                <IconButton
                  variant="ghost"
                  onClick={() => {
                    queryRedisKeys(redisId)
                  }}
                >
                  <RefreshCcwIcon />
                </IconButton>
              </Box>
            </Box>
            <RedisKeysTree
              nodes={keysTree}
              onSelect={(key) => {
                changeSelectedKey(key)
                queryRedisViewerState(redisId, key)
              }}
            />
          </Box>

          <Box
            {...(!keysState.loading && {
              opacity: 0,
              pointerEvents: 'none',
            })}
            className={s.LoaderWrapper}
          >
            <Loader />
          </Box>
        </Panel>
        <PanelResizeHandle />
        <Panel style={{ position: 'relative' }} defaultSize={50} minSize={30}>
          <Box
            display="flex"
            flexDirection="column"
            gap="0.5rem"
            overflowY="auto"
            height="100%"
            overscrollBehavior="none"
          >
            <Box display={selectedKey ? 'block' : 'none'} flex={1}>
              <RedisKeyViewer />
            </Box>

            <Box display={selectedKey ? 'none' : 'block'} flex={1}>
              <RedisKeyCreateForm />
            </Box>
          </Box>

          <Box
            {...(!viewerState.loading && {
              opacity: 0,
              pointerEvents: 'none',
            })}
            className={s.LoaderWrapper}
          >
            <Loader />
          </Box>
        </Panel>
      </PanelGroup>

      <RedisConnectionDeleteModal
        redisId={redisId}
        open={delOpen}
        onOpenChange={setDelOpen}
      />
    </Box>
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

export default () => {
  return (
    <ConnectRedisLoader>
      <Page />
    </ConnectRedisLoader>
  )
}
