import { Editor } from '@client/components/Editor'
import { Box } from '@client/components/ui/Box'
import { Button } from '@client/components/ui/Button'
import { FormField } from '@client/components/ui/Form'
import { Input } from '@client/components/ui/Input'
import { Slot } from '@radix-ui/react-slot'
import { useState } from 'react'
import { CloudCheckIcon, CloudUploadIcon } from 'lucide-react'
import { sendCommand } from '@xuerzong/redis-studio-invoke'
import { useRedisId } from '@client/hooks/useRedisId'
import { useRedisPubSubContext } from '@client/providers/RedisPubSubContext'
import { useSyncState } from '@client/hooks/useSyncState'
import { useIntlContext } from '@client/providers/IntlProvider'
import s from './index.module.scss'

export const RedisPubSubMessageForm = () => {
  const redisId = useRedisId()
  const { channel } = useRedisPubSubContext()
  const { formatMessage } = useIntlContext()
  const [currentChannel, setCurrentChannel] = useSyncState(
    channel === '*' ? '' : channel
  )
  const [message, setMessage] = useState('')
  const [published, setPublished] = useState(false)
  return (
    <Box
      borderTop="1px solid var(--border-color)"
      padding="var(--spacing-md)"
      display="flex"
      flexDirection="column"
      gap="1rem"
      flex={1}
      height="100%"
    >
      <FormField flexShrink={0} name="channel" label={formatMessage('channel')}>
        <Input
          value={currentChannel}
          placeholder={formatMessage('placeholder.enterChannelName')}
          onChange={(e) => {
            setCurrentChannel(e.target.value)
          }}
          readOnly={channel !== '*'}
        />
      </FormField>

      <FormField flex={1} name="message" label={formatMessage('message')}>
        <Slot className={s.MessageEditor} style={{ flex: 1 }}>
          <Editor
            value={message}
            height="100%"
            onChange={(e) => {
              setMessage(e)
            }}
          />
        </Slot>
      </FormField>

      <Box display="flex" alignItems="center" justifyContent="flex-end">
        <Button
          onClick={() => {
            sendCommand({
              id: redisId,
              command: 'PUBLISH',
              args: [currentChannel, message],
            }).then(() => {
              setPublished(true)
              setMessage('')
              setTimeout(() => {
                setPublished(false)
              }, 1000)
            })
          }}
        >
          {published ? <CloudCheckIcon /> : <CloudUploadIcon />}
          {formatMessage('publish')}
        </Button>
      </Box>
    </Box>
  )
}
