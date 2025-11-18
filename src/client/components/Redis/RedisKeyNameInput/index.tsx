import { useState } from 'react'
import { toast } from 'sonner'
import { CheckIcon } from 'lucide-react'
import { useSyncState } from '@/client/hooks/useSyncState'
import { InputWithPrefix } from '@/client/components/ui/Input'
import { useRedisKeyViewerContext } from '@/client/providers/RedisKeyViewer'
import { Box } from '@/client/components/ui/Box'
import { renameKey } from '@/client/commands/redis/key'
import {
  queryRedisKeys,
  queryRedisViewerState,
} from '@/client/stores/redisStore'
import { IconButton } from '@/client/components/ui/Button'

export const RedisKeyNameInput = () => {
  const { redisId, redisKeyState } = useRedisKeyViewerContext()
  const [keyName, setKeyName] = useSyncState(redisKeyState.keyName)
  const [checkLoading, setCheckLoaing] = useState(false)
  const onCheck = () => {
    setCheckLoaing(true)
    toast.promise(renameKey(redisId, redisKeyState.keyName, keyName), {
      loading: 'Loading...',
      success() {
        queryRedisKeys(redisId)
        queryRedisViewerState(redisId, keyName)
        return 'Rename Key Successfully'
      },
      error(error) {
        console.error(error)
        return error.message || 'Rename Key Failed'
      },
      finally() {
        setCheckLoaing(false)
      },
    })
  }
  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      gap="var(--spacing-md)"
      width="100%"
    >
      <InputWithPrefix
        style={{
          flex: 1,
        }}
        value={keyName}
        onChange={(e) => {
          setKeyName(e.target.value)
        }}
        prefixNode={<Box textTransform="capitalize">{redisKeyState.type}</Box>}
      />
      <IconButton
        variant="outline"
        onClick={onCheck}
        loading={checkLoading}
        disabled={checkLoading}
      >
        <CheckIcon />
      </IconButton>
    </Box>
  )
}
