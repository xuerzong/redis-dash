import { useRedisKeyViewerContext } from '@/client/providers/RedisKeyViewer'
import { delSTREAMData, setSTREAMData } from '@/client/commands/redis/STREAM'
import { RedisBaseTable } from '../RedisBaseTable'

export const RedisSTREAMTable: React.FC = () => {
  const { redisId, redisKeyState, refreshRedisKeyState } =
    useRedisKeyViewerContext()
  return (
    <RedisBaseTable
      rowKey={(row) => row['id']}
      columns={[
        {
          key: 'id',
          label: 'Id',
          width: '40%',
        },
        {
          key: 'value',
          label: 'Value',
          width: '60%',
        },
      ]}
      fields={[
        {
          name: 'id',
          label: 'Id',
          type: 'input',
        },
        {
          name: 'value',
          label: 'Value',
          type: 'editor',
        },
      ]}
      dataSource={redisKeyState.value.data}
      length={redisKeyState.value.length}
      defaultFormValues={{ id: '*' }}
      onRowAdd={async (value) => {
        await setSTREAMData(redisId, redisKeyState.keyName, value)
        refreshRedisKeyState()
      }}
      // onRowEdit={async (value, lastValue) => {
      //   await delSTREAMData(redisId, redisKeyState.keyName, lastValue)
      //   await setSTREAMData(redisId, redisKeyState.keyName, value)
      //   refreshRedisKeyState()
      // }}
      onRowDel={async (value) => {
        await delSTREAMData(redisId, redisKeyState.keyName, value)
        refreshRedisKeyState()
      }}
    />
  )
}
