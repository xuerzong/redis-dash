import { useParams } from 'react-router'

export const useRedisId = () => {
  const { instanceId } = useParams()
  return instanceId as string
}
