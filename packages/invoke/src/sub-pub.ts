import { isTauri } from '@tauri-apps/api/core'
import { useCallback } from 'react'
import { listen, type Event } from '@tauri-apps/api/event'
import { postDisconnectConnection } from './browser/api'
import { sendCommand } from './browser/invoke'
import { runRedisPsubscribe, runRedisPunsubscribe } from './tauri/invoke'

interface PubSubMessage {
  channel: string
  pattern: string
  message: string
}

type UseRedisPubSubSubscribe = (
  channel: string,
  callback: (data: PubSubMessage) => void
) => Promise<() => void>

type UseRedisPubSub = (redisId: string) => UseRedisPubSubSubscribe

const useRedisPubSubBroswer: UseRedisPubSub = (redisId: string) => {
  const subscribe = useCallback<UseRedisPubSubSubscribe>(
    async (channel: string, callback: (data: PubSubMessage) => void) => {
      await postDisconnectConnection(redisId, 'subscriber')

      await sendCommand({
        id: redisId,
        command: 'PSUBSCRIBE',
        args: [channel],
        role: 'subscriber',
      })

      window.invokeCallbacks.set('RedisPubSubRequestId', (data: string) => {
        try {
          callback({
            ...(JSON.parse(data) as PubSubMessage),
          })
        } catch (e) {
          console.error(e)
        }
      })
      return async () => {
        await sendCommand({
          id: redisId,
          command: 'PUNSUBSCRIBE',
          args: [channel],
          role: 'subscriber',
        })
        window.invokeCallbacks.delete('RedisPubSubRequestId')
      }
    },
    [redisId]
  )
  return subscribe
}

const useRedisPubSubTauri: UseRedisPubSub = (redisId: string) => {
  const subscribe = useCallback<UseRedisPubSubSubscribe>(
    async (channel: string, callback: (data: PubSubMessage) => void) => {
      await runRedisPsubscribe(redisId, channel)
      const removeListener = await listen(
        'redis_pubsub_message',
        (event: Event<PubSubMessage>) => {
          callback(event.payload)
        }
      )
      return async () => {
        await runRedisPunsubscribe(channel).catch(console.log)
        removeListener()
      }
    },
    [redisId]
  )
  return subscribe
}

export const useRedisPubSub: UseRedisPubSub = isTauri()
  ? useRedisPubSubTauri
  : useRedisPubSubBroswer
