import {
  RedisKeysProvider,
  useRedisKeysContext,
} from '@/client/providers/RedisKeysContext'
import { Box } from '@/client/components/ui/Box'
import { RedisKeysTree } from '../RedisKeysTree'
import { RedisKeysTreeToolbar } from '../RedisKeysTreeToolbar'
import { useRedisContext } from '@/client/providers/RedisContext'
import { LoaderMask } from '../../LoaderMask'

export const RedisKeysMenuRoot = () => {
  const { setSelectedKey } = useRedisContext()
  const { keyTreeNodes, loading: redisKeysLoading } = useRedisKeysContext()
  return (
    <Box
      position="relative"
      overflowY="auto"
      overscrollBehavior="none"
      height="100%"
    >
      <Box
        position="sticky"
        top={0}
        backgroundColor="var(--background-color)"
        borderBottom="1px solid var(--border-color)"
        zIndex={1}
      >
        <RedisKeysTreeToolbar />
      </Box>
      <RedisKeysTree
        nodes={keyTreeNodes}
        onSelect={(key) => {
          setSelectedKey(key)
        }}
      />

      <LoaderMask loading={redisKeysLoading} />
    </Box>
  )
}

export const RedisKeysMenu = () => {
  return (
    <RedisKeysProvider>
      <RedisKeysMenuRoot />
    </RedisKeysProvider>
  )
}
