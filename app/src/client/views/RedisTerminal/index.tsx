import { RedisTerminal } from '@client/components/RedisTerminal'
import { Box } from '@client/components/ui/Box'
import { useRedisId } from '@client/hooks/useRedisId'

export const Page = () => {
  const redisId = useRedisId()
  return (
    <Box height="100%">
      <RedisTerminal redisId={redisId} />
    </Box>
  )
}

export default Page
