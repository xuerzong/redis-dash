import { useMemo } from 'react'
import {
  delHASHData,
  setHASHData,
  type HASHData,
} from '@/client/commands/redis'
import { useRedisKeyStateContext } from '@/client/providers/RedisKeyStateContext'
import { RedisBaseTable } from '../RedisBaseTable'

export const RedisHASHTable: React.FC = () => {
  const {
    redisId,
    redisKeyState,
    refreshRedisKeyState,
    setTableProps,
    filterValue,
  } = useRedisKeyStateContext()

  const dataSource = useMemo(() => {
    const data = redisKeyState.value.data
    return data.filter((d: HASHData) => String(d.value).includes(filterValue))
  }, [redisKeyState, filterValue])

  return (
    <RedisBaseTable
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
      dataSource={dataSource}
      length={redisKeyState.value.length}
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
      onPageChange={setTableProps}
    />
  )
}
