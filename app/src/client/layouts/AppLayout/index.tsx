import { Outlet, useNavigate } from 'react-router'
import { PlusIcon, RotateCwIcon, PanelRightOpenIcon } from 'lucide-react'
import { useEffect, useRef } from 'react'
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
  type ImperativePanelHandle,
} from 'react-resizable-panels'
import { Box } from '@client/components/ui/Box'
import { IconButton } from '@client/components/ui/Button'
import {
  changeConnectionsCollapsed,
  queryConnections,
  useAppStore,
} from '@client/stores/appStore'
import { RedisConnectionsMenu } from '@client/components/Redis/RedisConnectionsMenu'
import s from './index.module.scss'

export const AppLayout = () => {
  const navigate = useNavigate()
  const connectionsCollapsed = useAppStore(
    (state) => state.connectionsCollapsed
  )
  const panelRef = useRef<ImperativePanelHandle>(null)

  useEffect(() => {
    queryConnections()
  }, [])

  useEffect(() => {
    if (!connectionsCollapsed && panelRef.current?.isCollapsed()) {
      panelRef.current.expand()
    }

    if (connectionsCollapsed && panelRef.current?.isExpanded()) {
      panelRef.current.collapse()
    }
  }, [connectionsCollapsed])

  return (
    <main className={s.Layout}>
      <PanelGroup direction="horizontal">
        <Panel
          ref={panelRef}
          defaultSize={20}
          minSize={20}
          className={s.Sider}
          collapsible
          onCollapse={() => {
            changeConnectionsCollapsed(true)
          }}
          onExpand={() => {
            changeConnectionsCollapsed(false)
          }}
        >
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

            <IconButton
              variant="ghost"
              onClick={() => {
                changeConnectionsCollapsed(true)
              }}
            >
              <PanelRightOpenIcon />
            </IconButton>
          </Box>
          <RedisConnectionsMenu />
        </Panel>

        {!connectionsCollapsed && <PanelResizeHandle />}
        <Panel defaultSize={80} minSize={70} className={s.Content}>
          <Outlet />
        </Panel>
      </PanelGroup>
    </main>
  )
}
