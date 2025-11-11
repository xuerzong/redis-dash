import {
  MoreHorizontalIcon,
  PlusIcon,
  RefreshCcwIcon,
  TrashIcon,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { Box } from '@/client/components/ui/Box'
import { keysToTree } from '@/client/utils/tree'
import { Button, IconButton } from '@/client/components/ui/Button'
import { RedisKeysTree } from '@/client/components/Redis/RedisKeysTree'
import { Tooltip } from '@/client/components/ui/Tooltip'
import { RedisKeyViewer } from '@/client/components/Redis/RedisKeyViewer'
import { Loader } from '@/client/components/Loader'
import { RedisKeyCreateForm } from '@/client/components/RedisKeyForm'
import { RedisKeySearchInput } from '@/client/components/Redis/RedisKeySearchInput'
import {
  changeRedisId,
  changeSelectedKey,
  queryRedisKeys,
  queryRedisViewerState,
  useRedisStore,
} from '@/client/stores/redisStore'
import { DropdownMenu } from '@/client/components/ui/DropdownMenu'
import { Modal } from '@/client/components/ui/Modal'
import { toast } from 'sonner'
import { useRedisId } from '@/client/hooks/useRedisId'
import { useNavigate } from 'react-router'
import { sendCommand, sendRequest } from '@/client/utils/invoke'
import { Select } from '@/client/components/ui/Select'
import s from './index.module.scss'

const Page = () => {
  const redisId = useRedisId()
  const navigate = useNavigate()
  const [confirmDelOpen, setConfirmDelOpen] = useState(false)

  const keysState = useRedisStore((state) => state.keysState)
  const viewerState = useRedisStore((state) => state.viewerState)
  const selectedKey = useRedisStore((state) => state.selectedKey)
  const filterType = useRedisStore((state) => state.filterType)
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

  useEffect(() => {
    sendCommand({
      id: redisId,
      command: 'INFO',
      args: ['SERVER'],
    }).then((data) => {
      console.log('INFO', data)
    })
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
          style={
            {
              '--border-radius': 0,
            } as any
          }
          display="flex"
          alignItems="center"
          marginLeft="auto"
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
                label: 'Delete',
                key: 'Delete',
                icon: <TrashIcon />,
                onClick() {
                  setConfirmDelOpen(true)
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
          <Box overflowY="auto" height="100%">
            <Box
              display="flex"
              alignItems="center"
              borderBottom="1px solid var(--border-color)"
              style={
                {
                  '--border-radius': 0,
                } as any
              }
            >
              <Box display="flex" alignItems="center" marginLeft="auto">
                {/* <IconButton variant="ghost">
                  <PlusIcon />
                </IconButton>

                <IconButton variant="ghost">
                  <MinusIcon />
                </IconButton> */}
                <Select
                  options={[
                    { label: '100', value: '100' },
                    { label: '200', value: '200' },
                    { label: '500', value: '500' },
                  ]}
                />
              </Box>
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

      <Modal
        title="Delete Connection"
        description="Confirm delete this connection?"
        footer={
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            gap="var(--spacing-md)"
            padding="1rem"
          >
            <Button variant="outline" onClick={() => setConfirmDelOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                toast.promise(
                  sendRequest({
                    url: '/api/connection',
                    method: 'DELETE',
                    body: { id: redisId },
                  }),
                  {
                    loading: 'Loading...',
                    success: () => {
                      navigate('/')
                      return 'Delete Connection Successfully'
                    },
                    error: (e) => e.message || 'Delete Connection Failed',
                  }
                )
              }}
            >
              Confirm
            </Button>
          </Box>
        }
        open={confirmDelOpen}
        onOpenChange={setConfirmDelOpen}
      />
    </Box>
  )
}

export default Page
