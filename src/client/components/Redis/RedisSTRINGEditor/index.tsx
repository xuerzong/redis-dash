import { toast } from 'sonner'
import { useState } from 'react'
import { Editor } from '@/client/components/Editor'
import { useRedisKeyViewerContext } from '@/client/providers/RedisKeyViewer'
import { Box } from '@/client/components/ui/Box'
import { Button } from '@/client/components/ui/Button'
import { setSTRINGData } from '@/client/commands/redis'
import { useSyncState } from '@/client/hooks/useSyncState'

export const RedisSTRINGEditor = () => {
  const { redisId, redisKeyState, refreshRedisKeyState } =
    useRedisKeyViewerContext()
  const [value, setValue] = useSyncState<string>(redisKeyState.value)
  const [loading, setLoading] = useState(false)

  const onSave = async () => {
    setLoading(true)
    toast.promise(setSTRINGData(redisId, redisKeyState.keyName, value), {
      loading: 'Loading...',
      success() {
        refreshRedisKeyState()
        return 'Update Data successfully'
      },
      error(error) {
        console.log(error)
        return 'Update Data Failed'
      },
      finally() {
        setLoading(true)
      },
    })
  }

  return (
    <Box display="flex" flexDirection="column" gap="var(--spacing-md)">
      <Editor value={value} onChange={(e) => setValue(e)} />
      <Box display="flex" alignItems="center" justifyContent="flex-end">
        <Button onClick={onSave} disabled={loading} loading={loading}>
          Save Change
        </Button>
      </Box>
    </Box>
  )
}
