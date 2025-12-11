import { Box } from '@client/components/ui/Box'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { RedisPubSubMessageForm } from '@client/components/Redis/RedisPubSubMessageForm'
import {
  RedisPubSubProvider,
  useRedisPubSubContext,
} from '@client/providers/RedisPubSubContext'
import { RedisPubSubMessageTable } from '@client/components/Redis/RedisPubSubMessageTable'
import { RedisPubSubChannelPicker } from '@client/components/Redis/RedisPubSubChannelPicker'

const Page = () => {
  const { channel } = useRedisPubSubContext()

  return (
    <Box position="relative" height="100%">
      <PanelGroup direction="vertical">
        <Panel>
          {!channel ? (
            <RedisPubSubChannelPicker />
          ) : (
            <Box padding="var(--spacing-md)">
              <RedisPubSubMessageTable />
            </Box>
          )}
        </Panel>

        <PanelResizeHandle />

        <Panel
          minSize={30}
          maxSize={60}
          defaultSize={50}
          onRateChange={(e) => {
            console.log(e)
          }}
        >
          <RedisPubSubMessageForm />
        </Panel>
      </PanelGroup>
    </Box>
  )
}

export default () => {
  return (
    <RedisPubSubProvider>
      <Page />
    </RedisPubSubProvider>
  )
}
