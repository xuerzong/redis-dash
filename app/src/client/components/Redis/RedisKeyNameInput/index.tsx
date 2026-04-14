import { useState } from 'react'
import { toast } from 'sonner'
import { CheckIcon } from 'lucide-react'
import { useSyncState } from '@client/hooks/useSyncState'
import { InputWithPrefix } from '@client/components/ui/Input'
import { useRedisKeyStateContext } from '@client/providers/RedisKeyStateContext'
import { Box } from '@client/components/ui/Box'
import { renameKey } from '@client/commands/redis/key'
import { IconButton } from '@client/components/ui/Button'
import { changeRedisKeys, useRedisStore } from '@client/stores/redisStore'
import { useRedisContext } from '@client/providers/RedisContext'
import { getRedisTypeVarKey } from '@client/constants/redisColors'

export const RedisKeyNameInput = () => {
  const { redisId, redisKeyState } = useRedisKeyStateContext()
  const colorKey = getRedisTypeVarKey(redisKeyState.type)
  const [keyName, setKeyName] = useSyncState(redisKeyState.keyName)
  const [checkLoading, setCheckLoaing] = useState(false)
  const redisKeys = useRedisStore((state) => state.redisKeysMap[redisId])
  const { setSelectedKey } = useRedisContext()
  const onCheck = () => {
    setCheckLoaing(true)
    toast.promise(renameKey(redisId, redisKeyState.keyName, keyName), {
      loading: 'Loading...',
      success() {
        changeRedisKeys(
          redisId,
          redisKeys.map((redisKey) => {
            if (redisKey.key === redisKeyState.keyName) {
              return { ...redisKey, key: keyName }
            }
            return redisKey
          })
        )
        setSelectedKey(keyName)
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
        prefixNode={
          <Box
            textTransform="capitalize"
            color={`rgba(var(--redis-type-${colorKey}-fg) / 1)`}
            backgroundColor={`rgba(var(--redis-type-${colorKey}-bg) / 0.3)`}
            border={`1px solid rgba(var(--redis-type-${colorKey}-border) / 0.55)`}
            borderRadius="0.25rem"
            padding="0.125rem 0.375rem"
          >
            {redisKeyState.type}
          </Box>
        }
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
