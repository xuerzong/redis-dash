import { FolderTreeIcon, LayoutListIcon, RefreshCcwIcon } from 'lucide-react'
import { queryRedisKeys } from '@/client/stores/redisStore'
import { Box } from '@/client/components/ui/Box'
import { IconButton } from '@/client/components/ui/Button'
import { useRedisId } from '@/client/hooks/useRedisId'
import { useRedisKeysMenuContext } from '@/client/providers/RedisKeysMenu'
import { Tooltip } from '@/client/components/ui/Tooltip'

export const RedisKeysTreeToolbar = () => {
  const redisId = useRedisId()
  const { viewMode, setViewMode } = useRedisKeysMenuContext()
  return (
    <Box
      width="100%"
      display="flex"
      alignItems="center"
      style={
        {
          '--border-radius': 0,
        } as any
      }
    >
      <IconButton
        variant="ghost"
        onClick={() => {
          queryRedisKeys(redisId)
        }}
      >
        <RefreshCcwIcon />
      </IconButton>
      <Box
        display="flex"
        alignItems="center"
        borderLeft="1px solid var(--border-color)"
        marginLeft="auto"
      >
        <Tooltip content="List View">
          <IconButton
            variant={viewMode === 'list' ? 'subtle' : 'ghost'}
            onClick={() => {
              setViewMode('list')
            }}
          >
            <LayoutListIcon />
          </IconButton>
        </Tooltip>

        <Tooltip content="Tree View">
          <IconButton
            variant={viewMode === 'tree' ? 'subtle' : 'ghost'}
            onClick={() => {
              setViewMode('tree')
            }}
          >
            <FolderTreeIcon />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  )
}
