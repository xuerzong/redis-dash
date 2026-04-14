import { getRedisTypeVarKey } from '@client/constants/redisColors'
import { Box } from '@client/components/ui/Box'

interface RedisTypeTagProps {
  type: string
}

export const RedisTypeTag: React.FC<RedisTypeTagProps> = ({ type }) => {
  const colorKey = getRedisTypeVarKey(type)

  return (
    <Box
      display="inline-block"
      fontSize="0.75rem"
      color={`rgba(var(--redis-type-${colorKey}-fg) / 1)`}
      backgroundColor={`rgba(var(--redis-type-${colorKey}-bg) / 0.35)`}
      border={`1px solid rgba(var(--redis-type-${colorKey}-border) / 0.55)`}
      borderRadius="0.25rem"
      padding="0.125rem 0.25rem"
    >
      {type}
    </Box>
  )
}
