import { Outlet, useNavigate } from 'react-router'
import { Box } from '@/client/components/ui/Box'
import { RedisIcon } from '@/client/components/Icons/RedisIcon'
import { IconButton } from '@/client/components/ui/Button'
import { changeConnections, useAppStore } from '@/client/stores/app'
import { PlusIcon, RotateCwIcon } from 'lucide-react'
import { useEffect } from 'react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { useRedisId } from '@/client/hooks/useRedisId'
import s from './index.module.scss'
import { sendRequest } from '@/client/utils/invoke'

export const AppLayout = () => {
  const connections = useAppStore((state) => state.connections)
  const navigate = useNavigate()
  const redisId = useRedisId()

  const queryConnections = () => {
    sendRequest({
      url: '/api/connections',
      method: 'GET',
    }).then((res) => {
      changeConnections(res)
    })
  }

  useEffect(() => {
    queryConnections()
  }, [])

  return (
    <main className={s.Layout}>
      <PanelGroup direction="horizontal">
        <Panel defaultSize={20} minSize={20} className={s.Sider}>
          <Box
            style={
              {
                '--border-radius': 0,
              } as any
            }
            display="flex"
            alignItems="center"
            justifyContent="flex-end"
          >
            <IconButton
              onClick={() => {
                navigate('/create')
              }}
              variant="ghost"
            >
              <PlusIcon />
            </IconButton>

            <IconButton onClick={queryConnections} variant="ghost">
              <RotateCwIcon />
            </IconButton>
          </Box>
          {(connections || []).map((d) => (
            <Box
              className={s.Instance}
              key={d.id}
              onClick={() => {
                navigate(`/${d.id}`)
              }}
              data-active={redisId === d.id}
            >
              <RedisIcon className={s.InstanceIcon} />
              {`${d.host}@${d.port}`}
            </Box>
          ))}
        </Panel>
        <PanelResizeHandle />
        <Panel defaultSize={80} minSize={50} className={s.Content}>
          <Outlet />
        </Panel>
      </PanelGroup>
    </main>
  )
}
