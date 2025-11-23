import { useParams } from 'react-router'

export const useRedisId = () => {
  const { redisId } = useParams()
  return redisId as string
}
