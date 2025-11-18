import { getRedisTypeColor } from '@/constants/redisColors'
import { Box } from '@/client/components/ui/Box'

interface RedisTypeTagProps {
  type: string
}

export const RedisTypeTag: React.FC<RedisTypeTagProps> = ({ type }) => {
  return (
    <Box
      display="inline-block"
      fontSize="0.75rem"
      backgroundColor={getRedisTypeColor(type)}
      borderRadius="var(--border-radius)"
      padding="0.125rem 0.25rem"
    >
      {type}
    </Box>
  )
}
