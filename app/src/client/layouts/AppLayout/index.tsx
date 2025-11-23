import { Outlet, useNavigate } from 'react-router'
import { PlusIcon, RotateCwIcon } from 'lucide-react'
import { useEffect } from 'react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { Box } from '@client/components/ui/Box'
import { IconButton } from '@client/components/ui/Button'
import { queryConnections } from '@client/stores/appStore'
import { RedisConnectionsMenu } from '@/client/components/Redis/RedisConnectionsMenu'
import s from './index.module.scss'

export const AppLayout = () => {
  const navigate = useNavigate()

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
            borderBottom="1px solid var(--border-color)"
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
          <RedisConnectionsMenu />
        </Panel>
        <PanelResizeHandle />
        <Panel defaultSize={80} minSize={50} className={s.Content}>
          <Outlet />
        </Panel>
      </PanelGroup>
    </main>
  )
}
