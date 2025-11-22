import { useMemo } from 'react'
import { useRedisKeyStateContext } from '@/client/providers/RedisKeyStateContext'
import { RedisBaseTable } from '../RedisBaseTable'
import { delSETData, setSETData, type SETData } from '@/client/commands/redis'

export const RedisSETTable: React.FC = () => {
  const { redisId, redisKeyState, refreshRedisKeyState, filterValue } =
    useRedisKeyStateContext()

  const dataSource = useMemo(() => {
    const data = redisKeyState.value.data
    return data.filter((d: SETData) => String(d.member).includes(filterValue))
  }, [redisKeyState, filterValue])

  return (
    <RedisBaseTable
      columns={[
        {
          key: 'member',
          label: 'Member',
          width: '100%',
        },
      ]}
      fields={[
        {
          name: 'member',
          label: 'Member',
          type: 'editor',
        },
      ]}
      dataSource={dataSource}
      length={redisKeyState.value.length}
      onRowAdd={async (values) => {
        await setSETData(redisId, redisKeyState.keyName, [values])
        refreshRedisKeyState()
      }}
      onRowEdit={async (values, lastValues) => {
        // No change
        if (values.member === lastValues.member) {
          return
        }
        await delSETData(redisId, redisKeyState.keyName, lastValues)
        await setSETData(redisId, redisKeyState.keyName, [values])
        refreshRedisKeyState()
      }}
      onRowDel={async (values) => {
        await delSETData(redisId, redisKeyState.keyName, values)
        refreshRedisKeyState()
      }}
    />
  )
}
