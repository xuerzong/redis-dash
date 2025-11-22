import { RedisForm } from '@/client/components/Redis/RedisForm'
import { Box } from '@/client/components/ui/Box'
import { Button } from '@/client/components/ui/Button'
import { Card } from '@/client/components/ui/Card'
import { useRedisId } from '@/client/hooks/useRedisId'
import { useAppStore } from '@/client/stores/appStore'
import { ChevronLeftIcon } from 'lucide-react'
import { useNavigate } from 'react-router'

const Page = () => {
  const redisId = useRedisId()
  const navigate = useNavigate()
  const connections = useAppStore((state) => state.connections)
  const currentConnection = connections.find((c) => c.id === redisId)
  return (
    <div>
      <Box borderBottom="1px solid var(--border-color)">
        <Button
          variant="ghost"
          onClick={() => {
            navigate(`/${redisId}`, { replace: true })
          }}
        >
          <ChevronLeftIcon />
          Back
        </Button>
      </Box>

      <Box padding="var(--spacing-md)">
        <Card>
          <RedisForm mode={0} defaultValues={currentConnection} />
        </Card>
      </Box>
    </div>
  )
}

export default Page
