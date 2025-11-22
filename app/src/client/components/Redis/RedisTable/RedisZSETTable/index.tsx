import { delZSETData, setZSETData } from '@/client/commands/redis'
import { RedisBaseTable } from '../RedisBaseTable'
import { useRedisKeyViewerContext } from '@/client/providers/RedisKeyViewer'

export const RedisZSETTable: React.FC = () => {
  const { redisId, redisKeyState, refreshRedisKeyState } =
    useRedisKeyViewerContext()
  return (
    <RedisBaseTable
      rowKey={(row) => row['member']}
      columns={[
        {
          key: 'score',
          label: 'Score',
          width: '50%',
        },
        {
          key: 'member',
          label: 'Member',
          width: '50%',
        },
      ]}
      fields={[
        {
          name: 'score',
          label: 'Score',
          type: 'input',
        },
        {
          name: 'member',
          label: 'Member',
          type: 'editor',
        },
      ]}
      dataSource={redisKeyState.value.data}
      length={redisKeyState.value.length}
      onRowAdd={async (values) => {
        await setZSETData(redisId, redisKeyState.keyName, [values])
        refreshRedisKeyState()
      }}
      onRowEdit={async (values, lastValues) => {
        if (values.member !== lastValues.member) {
          await delZSETData(redisId, redisKeyState.keyName, values)
          await setZSETData(redisId, redisKeyState.keyName, [values])
        } else {
          await setZSETData(redisId, redisKeyState.keyName, [values])
        }
        refreshRedisKeyState()
      }}
      onRowDel={async (values) => {
        await delZSETData(redisId, redisKeyState.keyName, values)
        refreshRedisKeyState()
      }}
    />
  )
}
