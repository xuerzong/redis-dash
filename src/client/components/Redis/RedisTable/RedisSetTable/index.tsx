import { useRedisKeyViewerContext } from '@/client/providers/RedisKeyViewer'
import { RedisTableViewer, type RedisBaseTableProps } from '../RedisBaseTable'
import { delSETData, setSETData } from '@/client/commands/redis'

interface RedisSETTableProps
  extends Pick<RedisBaseTableProps, 'dataSource' | 'length'> {}

export const RedisSETTable: React.FC<RedisSETTableProps> = (props) => {
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
      {...props}
      onRowAdd={async (values) => {
        await setSETData(redisId, redisKeyState.keyName, [values])
        refreshRedisKeyState()
      }}
      onRowEdit={async (values, lastValues) => {
        // No change
        if (values.member === lastValues.member) {
          return
        }
        await delSETData(redisId, redisKeyState.keyName, values)
        await setSETData(redisId, redisKeyState.keyName, [values.member])
        refreshRedisKeyState()
      }}
      onRowDel={async (values) => {
        await delSETData(redisId, redisKeyState.keyName, values)
        refreshRedisKeyState()
      }}
    />
  )
}
