import { FolderTreeIcon, LayoutListIcon, RefreshCcwIcon } from 'lucide-react'
import { Box } from '@/client/components/ui/Box'
import { IconButton } from '@/client/components/ui/Button'
import { useRedisKeysContext } from '@/client/providers/RedisKeysContext'
import { Tooltip } from '@/client/components/ui/Tooltip'
import { RedisKeySearchInput } from '../RedisKeySearchInput'

export const RedisKeysTreeToolbar = () => {
  const { viewMode, setViewMode } = useRedisKeysContext()
  const { refreshKeys } = useRedisKeysContext()
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
      <RedisKeySearchInput />
      <Box flex={1}></Box>
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

        <Box borderLeft="1px solid var(--border-color)">
          <Tooltip content="Refresh">
            <IconButton
              variant="ghost"
              onClick={() => {
                refreshKeys()
              }}
            >
              <RefreshCcwIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  )
}
