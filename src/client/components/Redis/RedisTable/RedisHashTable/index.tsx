import { delHASHData, setHASHData } from '@/client/commands/redis'
import { useRedisKeyViewerContext } from '@/client/providers/RedisKeyViewer'
import { RedisTableViewer } from '../RedisBaseTable'

interface RedisHASHTableProps {
  dataSource?: any[]
  length?: number
  onDataChange?: (data: any[]) => void
}

export const RedisHASHTable: React.FC<RedisHASHTableProps> = (props) => {
  const { redisId, redisKeyState, refreshRedisKeyState } =
    useRedisKeyViewerContext()
  return (
    <RedisTableViewer
      rowKey={(row) => row.field}
      columns={[
        {
          key: 'field',
          label: 'Field',
          width: '50%',
        },
        {
          key: 'value',
          label: 'Value',
          width: '50%',
        },
      ]}
      fields={[
        {
          name: 'field',
          label: 'Field',
          type: 'input',
        },
        {
          name: 'value',
          label: 'Value',
          type: 'editor',
        },
      ]}
      {...props}
      onRowAdd={async (values) => {
        await setHASHData(redisId, redisKeyState.keyName, [values])
        refreshRedisKeyState()
      }}
      onRowEdit={async (values, lastValues) => {
        // If the user has changed the field name,
        // we must delete the record associated with the old field name first.
        if (lastValues.field !== values.field) {
          await delHASHData(redisId, redisKeyState.keyName, values)
        }
        await setHASHData(redisId, redisKeyState.keyName, [values])
        refreshRedisKeyState()
      }}
      onRowDel={async (values) => {
        await delHASHData(redisId, redisKeyState.keyName, values)
        refreshRedisKeyState()
      }}
    />
  )
}
