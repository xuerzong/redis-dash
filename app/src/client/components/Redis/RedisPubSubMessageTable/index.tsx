import dayjs from 'dayjs'
import { useEffect } from 'react'
import { useRedisId } from '@client/hooks/useRedisId'
import { useRedisPubSubContext } from '@client/providers/RedisPubSubContext'
import { sendCommand } from '@xuerzong/redis-studio-invoke'
import api from '@xuerzong/redis-studio-invoke/api'
import { Table, type TableColumn } from '@client/components/ui/Table'
import { Box } from '../../ui/Box'
import { Input } from '../../ui/Input'
import { Button } from '../../ui/Button'
import { BellMinusIcon } from 'lucide-react'
import { useIntlContext } from '@client/providers/IntlProvider'
import {
  addRedisPubSubMessage,
  useRedisPubSubStore,
} from '@client/stores/redisPubSubStore'

export const RedisPubSubMessageTable = () => {
  const redisId = useRedisId()
  const { channel, setChannel } = useRedisPubSubContext()
  const { formatMessage } = useIntlContext()
  const messages = useRedisPubSubStore((state) => state.messages)

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

  const onUnSubscribe = () => {
    sendCommand({
      id: redisId,
      command: 'PUNSUBSCRIBE',
      args: [channel],
      role: 'subscriber',
    })
    window.invokeCallbacks.delete(channel)
  }

  const onSubscribe = () => {
    api.postDisconnectConnection(redisId, 'subscriber').then(() => {
      sendCommand({
        id: redisId,
        command: 'PSUBSCRIBE',
        args: [channel],
        role: 'subscriber',
      })
      window.invokeCallbacks.set(`RedisPubSubRequestId`, (data: any) => {
        try {
          addRedisPubSubMessage({
            time: dayjs().format('YYYY/MM/DD hh:mm:ss'),
            ...JSON.parse(data),
          })
        } catch (e) {
          console.log(e)
        }
      })
    })
  }

  useEffect(() => {
    onSubscribe()
    return () => {
      onUnSubscribe()
    }
  }, [])
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
              onUnSubscribe()
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
