import { useRedisKeyViewerContext } from '@/client/providers/RedisKeyViewer'
import { RedisTableViewer } from '../RedisBaseTable'
import { delSETData, setSETData } from '@/client/commands/redis'

export const RedisSETTable: React.FC = () => {
  const { redisId, redisKeyState, refreshRedisKeyState } =
    useRedisKeyViewerContext()
  return (
    <RedisTableViewer
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
      dataSource={redisKeyState.value.data}
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
