import { useRedisKeysContext } from '@client/providers/RedisKeysContext'
import { Select } from '@client/components/ui/Select'
import { redisKeyTypes } from '@client/constants/redisKeyTypes'

export const RedisKeysFilterTypeSelector = () => {
  const { filterType, setFilterType } = useRedisKeysContext()
  const options = [
    { label: 'ALL', value: 'all' },
    ...redisKeyTypes.map((type) => ({ label: type, value: type })),
  ]
  return (
    <Select
      value={filterType}
      className="RedisKeysFilterTypeSelector"
      options={options}
      onChange={(e) => {
        setFilterType(e)
      }}
    />
  )
}
