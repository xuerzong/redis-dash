import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { Box } from '@client/components/ui/Box'
import { RedisKeyViewer } from '@client/components/Redis/RedisKeyViewer'
import { RedisKeyCreateForm } from '@client/components/RedisKeyForm'
import { RedisKeysMenu } from '@client/components/Redis/RedisKeysMenu'
import { useRedisContext } from '@client/providers/RedisContext'

const Page = () => {
  const { selectedKey } = useRedisContext()

  return (
    <Box height="100%" display="flex" flexDirection="column">
      <PanelGroup style={{ flex: 1 }} direction="horizontal">
        <Panel
          defaultSize={50}
          minSize={30}
          style={{
            position: 'relative',
            borderRight: '1px solid var(--border-color)',
          }}
        >
          <RedisKeysMenu />
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
        </Panel>
      </PanelGroup>
    </Box>
  )
}

export default Page
