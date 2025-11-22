import {
  delLISTData,
  setLISTData,
  updateLISTData,
} from '@/client/commands/redis'
import { RedisTableViewer } from '../RedisBaseTable'
import { useRedisKeyViewerContext } from '@/client/providers/RedisKeyViewer'

export const RedisLISTTable: React.FC = () => {
  const { redisId, redisKeyState, refreshRedisKeyState } =
    useRedisKeyViewerContext()
  return (
    <RedisTableViewer
      columns={[
        {
          key: 'index',
          label: 'Index',
          width: '50%',
        },
        {
          key: 'element',
          label: 'Element',
          width: '50%',
        },
      ]}
      fields={[
        {
          name: 'element',
          label: 'Element',
          type: 'editor',
        },
      ]}
      dataSource={redisKeyState.value.data}
      length={redisKeyState.value.length}
      onRowAdd={async (values) => {
        await setLISTData(redisId, redisKeyState.keyName, [values])
        refreshRedisKeyState()
      }}
      onRowEdit={async (values) => {
        await updateLISTData(redisId, redisKeyState.keyName, values)
        refreshRedisKeyState()
      }}
      onRowDel={async (values) => {
        await delLISTData(redisId, redisKeyState.keyName, values)
        refreshRedisKeyState()
      }}
    />
  )
}
