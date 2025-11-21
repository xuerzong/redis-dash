import { useMemo } from 'react'
import {
  RedisKeysMenuProvider,
  useRedisKeysMenuContext,
} from '@/client/providers/RedisKeysMenu'
import { Box } from '@/client/components/ui/Box'
import { keysToTree, TreeNode } from '@/client/utils/tree'
import {
  changeSelectedKey,
  queryRedisViewerState,
  useRedisStore,
} from '@/client/stores/redisStore'
import { useRedisId } from '@/client/hooks/useRedisId'
import { RedisKeysTree } from '../RedisKeysTree'
import { RedisKeysTreeToolbar } from '../RedisKeysTreeToolbar'

export const RedisKeysMenuRoot = () => {
  const redisId = useRedisId()
  const { viewMode } = useRedisKeysMenuContext()
  const filterType = useRedisStore((state) => state.filterType)
  const keysState = useRedisStore((state) => state.keysState)
  const keysTree = useMemo(() => {
    const filteredKeys = (keysState.data || [])
      .filter((key) => filterType === 'all' || key.type === filterType)
      .map((key) => key.key)

    if (viewMode === 'tree') {
      return keysToTree(filteredKeys)
    }

    return filteredKeys.map((key) => new TreeNode(key))
  }, [keysState, filterType, viewMode])
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
        nodes={keysTree}
        onSelect={(key) => {
          changeSelectedKey(key)
          queryRedisViewerState(redisId, key)
        }}
      />
    </Box>
  )
}

export const RedisKeysMenu = () => {
  return (
    <RedisKeysMenuProvider>
      <RedisKeysMenuRoot />
    </RedisKeysMenuProvider>
  )
}
