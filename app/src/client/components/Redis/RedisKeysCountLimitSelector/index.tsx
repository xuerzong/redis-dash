import { useRedisKeysContext } from '@/client/providers/RedisKeysContext'
import { Box } from '@client/components/ui/Box'
import { Select } from '@client/components/ui/Select'

export const RedisKeysCountLimitSelector = () => {
  const { keysCountLimit, setKeysCountLimit } = useRedisKeysContext()
  return (
    <Box
      display="flex"
      alignItems="center"
      marginLeft="auto"
      paddingLeft="var(--spacing-md)"
      flexShrink={0}
    >
      <Box fontSize="0.875rem" userSelect="none">
        COUNT
      </Box>
      <Select
        options={[
          { label: '100', value: '100' },
          { label: '200', value: '200' },
          { label: '500', value: '500' },
        ]}
        value={keysCountLimit.toString()}
        onChange={(e) => {
          setKeysCountLimit(Number(e))
        }}
      />
    </Box>
  )
}
