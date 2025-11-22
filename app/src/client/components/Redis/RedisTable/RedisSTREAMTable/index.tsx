import { useMemo } from 'react'
import { useRedisKeyStateContext } from '@/client/providers/RedisKeyStateContext'
import {
  delSTREAMData,
  setSTREAMData,
  type STREAMData,
} from '@/client/commands/redis/STREAM'
import { RedisBaseTable } from '../RedisBaseTable'

export const RedisSTREAMTable: React.FC = () => {
  const { redisId, redisKeyState, refreshRedisKeyState, filterValue } =
    useRedisKeyStateContext()

  const dataSource = useMemo(() => {
    const data = redisKeyState.value.data
    return data.filter((d: STREAMData) => String(d.value).includes(filterValue))
  }, [redisKeyState, filterValue])

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
      dataSource={dataSource}
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
