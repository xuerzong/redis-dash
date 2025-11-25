import { RedisForm } from '@client/components/Redis/RedisForm'
import { Box } from '@client/components/ui/Box'
import { Card } from '@client/components/ui/Card'
import { useRedisId } from '@client/hooks/useRedisId'
import { useAppStore } from '@client/stores/appStore'

const Page = () => {
  const redisId = useRedisId()
  const connections = useAppStore((state) => state.connections)
  const currentConnection = connections.find((c) => c.id === redisId)
  return (
    <Box padding="var(--spacing-md)">
      <Card>
        <RedisForm mode={0} defaultValues={currentConnection} />
      </Card>
    </Box>
  )
}

export default Page
