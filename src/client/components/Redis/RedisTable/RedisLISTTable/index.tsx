import {
  delLISTData,
  setLISTData,
  updateLISTData,
} from '@/client/commands/redis'
import { RedisTableViewer, type RedisBaseTableProps } from '../RedisBaseTable'
import { useRedisKeyViewerContext } from '@/client/providers/RedisKeyViewer'

interface RedisLISTTableProps
  extends Pick<RedisBaseTableProps, 'dataSource' | 'length'> {}

export const RedisLISTTable: React.FC<RedisLISTTableProps> = (props) => {
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
      {...props}
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
