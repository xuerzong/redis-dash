import { toast } from 'sonner'
import { CheckIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { getTTL } from '@/client/commands/redis'
import { NumberInputWithPrefix } from '@/client/components/ui/NumberInput'
import { useSyncState } from '@/client/hooks/useSyncState'
import { useRedisKeyViewerContext } from '@/client/providers/RedisKeyViewer'
import { Box } from '@/client/components/ui/Box'
import { IconButton } from '@/client/components/ui/Button'
import { expireKey } from '@/client/commands/redis/key'

export const RedisKeyTTLInput = () => {
  const { redisId, redisKeyState } = useRedisKeyViewerContext()
  const ttlIntervalIdRef = useRef<any>(null)
  const [hasFocused, setHasFocused] = useState(false)
  const [ttlValue, setTtlValue] = useSyncState(redisKeyState.ttl)
  const [checkLoading, setCheckLoading] = useState(false)
  useEffect(() => {
    if (hasFocused || ttlValue <= 0) {
      return clearInterval(ttlIntervalIdRef.current)
    }
    ttlIntervalIdRef.current = setTimeout(() => {
      getTTL(redisId, redisKeyState.keyName).then((res) => {
        setTtlValue(res)
      })
    }, 1000)
    return () => {
      if (ttlIntervalIdRef.current) {
        clearInterval(ttlIntervalIdRef.current)
      }
    }
  }, [ttlValue, redisId, redisKeyState, hasFocused])

  const onCheck = async () => {
    if (ttlValue < 0) return
    setCheckLoading(true)
    toast.promise(expireKey(redisId, redisKeyState.keyName, ttlValue), {
      loading: 'Loading...',
      success() {
        return 'Expire Key Successfully'
      },
      error(error) {
        console.error(error)
        return error.message || 'Expire Key Failed'
      },
      finally() {
        setCheckLoading(false)
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
      <NumberInputWithPrefix
        min={-1}
        value={ttlValue.toString()}
        onChange={(e) => {
          setTtlValue(Number(e))
        }}
        onFocus={() => {
          setHasFocused(true)
        }}
        onBlur={() => {
          setHasFocused(false)
        }}
        prefixNode={'TTL'}
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
