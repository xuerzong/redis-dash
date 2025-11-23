import { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router'
import { useRedisId } from '@/client/hooks/useRedisId'
import { useAppStore } from '@/client/stores/appStore'

export const RedisLayout: React.FC = () => {
  const redisId = useRedisId()
  const connections = useAppStore((state) => state.connections)
  const navigate = useNavigate()

  useEffect(() => {
    if (
      redisId &&
      connections.length &&
      !connections.find((d) => d.id === redisId)
    ) {
      navigate(`/${connections[0].id}`)
    }
  }, [redisId, connections])

  return <Outlet />
}
