import { Box } from '@/client/components/ui/Box'
import {
  RedisKeyViewerProvider,
  useRedisKeyViewerContext,
} from '@/client/providers/RedisKeyViewer'
import { LoaderMask } from '@/client/components/LoaderMask'
import { RedisKeyTTLInput } from '../RedisKeyTTLInput'
import { RedisKeyNameInput } from '../RedisKeyNameInput'
import { RedisSTRINGEditor } from '../RedisSTRINGEditor'
import { RedisZSETTable } from '../RedisTable/RedisZSETTable'
import { RedisLISTTable } from '../RedisTable/RedisLISTTable'
import { RedisSETTable } from '../RedisTable/RedisSETTable'
import { RedisSTREAMTable } from '../RedisTable/RedisSTREAMTable'
import { RedisHASHTable } from '../RedisTable/RedisHASHTable'

export const RedisKeyViewerComponent: React.FC = () => {
  const { redisKeyState, loading } = useRedisKeyViewerContext()

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
        {redisKeyState.type === 'HASH' && (
          <RedisHASHTable key={redisKeyState.keyName} />
        )}
        {redisKeyState.type === 'ZSET' && (
          <RedisZSETTable key={redisKeyState.keyName} />
        )}
        {redisKeyState.type === 'SET' && (
          <RedisSETTable key={redisKeyState.keyName} />
        )}
        {redisKeyState.type === 'LIST' && (
          <RedisLISTTable key={redisKeyState.keyName} />
        )}
        {redisKeyState.type === 'STREAM' && (
          <RedisSTREAMTable key={redisKeyState.keyName} />
        )}
        {redisKeyState.type === 'STRING' && (
          <RedisSTRINGEditor key={redisKeyState.keyName} />
        )}
      </Box>

      <LoaderMask loading={loading} />
    </Box>
  )
}

export const RedisKeyViewer = () => {
  return (
    <RedisKeyViewerProvider>
      <RedisKeyViewerComponent />
    </RedisKeyViewerProvider>
  )
}
