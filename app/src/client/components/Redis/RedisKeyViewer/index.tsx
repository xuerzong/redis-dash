import { Box } from '@/client/components/ui/Box'
import {
  queryRedisViewerState,
  useRedisStore,
} from '@/client/stores/redisStore'
import { useRedisId } from '@/client/hooks/useRedisId'
import {
  RedisKeyViewerProvider,
  useRedisKeyViewerContext,
} from '@/client/providers/RedisKeyViewer'
import { RedisKeyTTLInput } from '../RedisKeyTTLInput'
import { RedisKeyNameInput } from '../RedisKeyNameInput'
import { RedisSTRINGEditor } from '../RedisSTRINGEditor'
import { RedisZSETTable } from '../RedisTable/RedisZSETTable'
import { RedisLISTTable } from '../RedisTable/RedisLISTTable'
import { RedisSETTable } from '../RedisTable/RedisSETTable'
import { RedisSTREAMTable } from '../RedisTable/RedisSTREAMTable'
import { RedisHASHTable } from '../RedisTable/RedisHASHTable'

export const RedisKeyViewerComponent: React.FC = () => {
  const { redisKeyState } = useRedisKeyViewerContext()

  return (
    <Box
      position="relative"
      display="flex"
      flexDirection="column"
      height="100%"
    >
      <Box
        position="sticky"
        top={0}
        zIndex={1}
        display="flex"
        alignItems="center"
        gap="var(--spacing-md)"
        backgroundColor="var(--background-color)"
        padding="var(--spacing-md)"
        borderBottom="1px solid var(--border-color)"
      >
        <RedisKeyNameInput />

        <RedisKeyTTLInput />
      </Box>
      <Box padding="var(--spacing-md)">
        {redisKeyState.type === 'HASH' && <RedisHASHTable />}
        {redisKeyState.type === 'ZSET' && <RedisZSETTable />}
        {redisKeyState.type === 'SET' && <RedisSETTable />}
        {redisKeyState.type === 'LIST' && <RedisLISTTable />}
        {redisKeyState.type === 'STREAM' && <RedisSTREAMTable />}
        {redisKeyState.type === 'STRING' && <RedisSTRINGEditor />}
      </Box>
    </Box>
  )
}

export const RedisKeyViewer = () => {
  const redisId = useRedisId()
  const redisKeyState = useRedisStore((state) => state.viewerState.data)
  return (
    <RedisKeyViewerProvider
      redisId={redisId}
      redisKeyState={redisKeyState}
      refreshRedisKeyState={() => {
        return queryRedisViewerState(redisId, redisKeyState.keyName)
      }}
      key={`${redisId}_${redisKeyState.keyName}`}
    >
      <RedisKeyViewerComponent />
    </RedisKeyViewerProvider>
  )
}
