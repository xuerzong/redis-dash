import dayjs from 'dayjs'
import { useEffect, useRef } from 'react'
import { useRedisId } from '@client/hooks/useRedisId'
import { useRedisPubSubContext } from '@client/providers/RedisPubSubContext'
import { Table, type TableColumn } from '@client/components/ui/Table'
import { Box } from '@client/components/ui/Box'
import { Input } from '@client/components/ui/Input'
import { Button } from '@client/components/ui/Button'
import { BellMinusIcon } from 'lucide-react'
import { useIntlContext } from '@client/providers/IntlProvider'
import {
  addRedisPubSubMessage,
  useRedisPubSubStore,
} from '@client/stores/redisPubSubStore'
import { useRedisPubSub } from '@xuerzong/redis-dash-invoke/pub-sub'

export const RedisPubSubMessageTable = () => {
  const redisId = useRedisId()
  const { channel, setChannel } = useRedisPubSubContext()
  const { formatMessage } = useIntlContext()
  const messages = useRedisPubSubStore((state) => state.messages)
  const redisSubscriber = useRedisPubSub(redisId)
  const removeSubscribeListener = useRef(() => {})

  const columns: TableColumn[] = [
    {
      key: 'time',
      label: 'Time',
      width: 200,
    },
    {
      key: 'channel',
      label: 'Channel',
      width: 200,
    },
    {
      key: 'message',
      label: 'Message',
    },
  ]

  const onSubscribe = async (channel: string) => {
    removeSubscribeListener.current = await redisSubscriber(
      channel,
      (message) => {
        addRedisPubSubMessage({
          ...message,
          time: dayjs().format('YYYY/MM/DD hh:mm:ss'),
        })
      }
    )
  }

  useEffect(() => {
    onSubscribe(channel)
    return () => {
      removeSubscribeListener.current()
    }
  }, [channel])

  return (
    <Box display="flex" flexDirection="column" gap="var(--spacing-md)">
      <Box display="flex" justifyContent="flex-end">
        <Box
          maxWidth="20rem"
          display="flex"
          alignItems="center"
          gap="var(--spacing-md)"
        >
          <Input value={channel} readOnly />
          <Button
            onClick={() => {
              removeSubscribeListener.current()
              setChannel('')
            }}
          >
            <BellMinusIcon />
            {formatMessage('unsubscribe')}
          </Button>
        </Box>
      </Box>
      <Table columns={columns} data={messages} />
    </Box>
  )
}
