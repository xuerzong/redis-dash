import { toast } from 'sonner'
import { useState } from 'react'
import { Editor } from '@client/components/Editor'
import { useRedisKeyStateContext } from '@client/providers/RedisKeyStateContext'
import { Box } from '@client/components/ui/Box'
import { setSTRINGData } from '@client/commands/redis'
import { useSyncState } from '@client/hooks/useSyncState'
import s from './index.module.scss'

export const RedisSTRINGEditor = () => {
  const { redisId, redisKeyState, refreshRedisKeyState } =
    useRedisKeyStateContext()
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
        setLoading(false)
      },
    })
  }

  return (
    <Box className={s.RedisStringEditor}>
      <Editor
        value={value}
        onChange={(e) => setValue(e)}
        onSave={onSave}
        onRefresh={() => {
          setValue(redisKeyState.value)
        }}
      />
    </Box>
  )
}
