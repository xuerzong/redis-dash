import { FolderTreeIcon, LayoutListIcon, RefreshCcwIcon } from 'lucide-react'
import { Box } from '@client/components/ui/Box'
import { IconButton } from '@client/components/ui/Button'
import { useRedisKeysContext } from '@client/providers/RedisKeysContext'
import { Tooltip } from '@client/components/ui/Tooltip'
import { RedisKeyNameSearchInput } from '@/client/components/Redis/RedisKeyNameSearchInput'
import { RedisKeysCountLimitSelector } from '../RedisKeysCountLimitSelector'
import { RedisKeysFilterTypeSelector } from '../RedisKeysFilterTypeSelector'
import s from './index.module.scss'

export const RedisKeysTreeToolbar = () => {
  const { viewMode, setViewMode } = useRedisKeysContext()
  const { refreshKeys } = useRedisKeysContext()
  return (
    <Box>
      <Box
        width="100%"
        display="flex"
        alignItems="center"
        style={
          {
            '--border-radius': 0,
          } as any
        }
        className={s.RedisKeysToolbar}
      >
        <RedisKeysFilterTypeSelector />
        <RedisKeysCountLimitSelector />
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
      <Box borderTop="1px solid var(--border-color)">
        <RedisKeyNameSearchInput />
      </Box>
    </Box>
  )
}
