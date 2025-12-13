import { useRef } from 'react'
import { BellPlusIcon } from 'lucide-react'
import { useIntlContext } from '@/client/providers/IntlProvider'
import { Box } from '@client/components/ui/Box'
import { Button } from '@client/components/ui/Button'
import { Input } from '@client/components/ui/Input'
import { useRedisPubSubContext } from '@client/providers/RedisPubSubContext'

export const RedisPubSubChannelPicker = () => {
  const { setChannel } = useRedisPubSubContext()
  const channelRef = useRef('')
  const { formatMessage } = useIntlContext()
  return (
    <Box height="100%" display="flex" alignItems="center">
      <Box
        display="flex"
        maxWidth="36rem"
        margin="0 auto"
        alignItems="center"
        gap="var(--spacing-md)"
        height="100%"
      >
        <Input
          onChange={(e) => {
            channelRef.current = e.target.value
          }}
          placeholder={formatMessage('placeholder.enterChannelName')}
        />
        <Button
          style={{ flexShrink: 0 }}
          onClick={() => {
            setChannel(channelRef.current)
            channelRef.current = ''
          }}
        >
          <BellPlusIcon />
          {formatMessage('subscribe')}
        </Button>
      </Box>
    </Box>
  )
}
