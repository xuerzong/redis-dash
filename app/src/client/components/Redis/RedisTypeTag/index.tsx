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
      color={`rgba(var(--redis-type-${colorKey}) / 1)`}
      fontWeight="500"
    >
      {type}
    </Box>
  )
}
