import { useMemo } from 'react'
import {
  delLISTData,
  setLISTData,
  updateLISTData,
  type LISTData,
} from '@/client/commands/redis'
import { useRedisKeyStateContext } from '@/client/providers/RedisKeyStateContext'
import { RedisBaseTable } from '../RedisBaseTable'

export const RedisLISTTable: React.FC = () => {
  const {
    redisId,
    redisKeyState,
    refreshRedisKeyState,
    setTableProps,
    filterValue,
  } = useRedisKeyStateContext()

  const dataSource = useMemo(() => {
    const data = redisKeyState.value.data
    return data.filter((d: LISTData) => String(d.element).includes(filterValue))
  }, [redisKeyState, filterValue])

  return (
    <RedisBaseTable
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
      dataSource={dataSource}
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
      onPageChange={setTableProps}
      enablePageChanger
    />
  )
}
