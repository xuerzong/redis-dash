import { sendCommand } from '@/client/utils/invoke'

export const getSTREAMData = async (id: string, key: string) => {
  const [[_, data]] = await sendCommand<[[string, [string, string[]][]]]>({
    id,
    command: 'XREAD',
    args: ['COUNT', 100, 'STREAMS', key, 0],
  })

  return data.reduce(
    (pre, cur) => {
      const [id, value] = cur
      let encodedValue = {}
      for (let i = 0; i < value.length; i += 2) {
        encodedValue = { ...encodedValue, [value[i]]: value[i + 1] }
      }
      return [...pre, { id, value: JSON.stringify(encodedValue) }]
    },
    [] as { id: string; value: string }[]
  )
}

export const getSTREAMLen = (id: string, key: string) => {
  return sendCommand<number>({
    id,
    command: 'XLEN',
    args: [key],
  })
}

export const setSTREAMData = (
  id: string,
  key: string,
  value: {
    id?: string
    value: string
  }
) => {
  return sendCommand({
    id,
    command: 'XADD',
    args: [
      key,
      value.id || '*',
      ...Object.entries(JSON.parse(value.value)).flat(),
    ],
  })
}

export const delSTREAMData = (
  id: string,
  key: string,
  value: {
    id?: string
    value: string
  }
) => {
  return sendCommand({
    id,
    command: 'XDEL',
    args: [key, value.id],
  })
}
