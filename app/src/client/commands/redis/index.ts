import type { RedisKeyType } from '@/constants/redisKeyTypes'
import { getSTREAMData, getSTREAMLen } from '../redis/STREAM'
import { getLISTData, getLISTLen } from './LIST'
import { getHASHData, getHASHLen } from './HASH'
import { getSETData, getSETLen } from './SET'
import { getZSETData, getZSETLen } from './ZSET'
import { getSTRINGData } from './STRING'
import { getTTL, getKeyType } from './common'
export * from './LIST'
export * from './HASH'
export * from './SET'
export * from './ZSET'
export * from './STRING'
export * from './STREAM'
export * from './common'
export interface GetRedisStateParams {
  pageNo: number
  pageSize: number
}

export const getRedisState = async (
  id: string,
  key: string,
  parmas: GetRedisStateParams = {
    pageNo: 1,
    pageSize: 100,
  }
) => {
  const nextValueState: {
    keyName: string
    ttl: number
    type: RedisKeyType | 'UNSET'
    value: any
  } = {
    keyName: '',
    ttl: -1,
    type: 'UNSET',
    value: '',
  }

  nextValueState.keyName = key

  const ttl = await getTTL(id, key)
  nextValueState.ttl = ttl

  const type = await getKeyType(id, key)
  nextValueState.type = type.toUpperCase() as RedisKeyType

  switch (type.toUpperCase()) {
    case 'HASH': {
      nextValueState.value = {
        data: await getHASHData(id, key),
        length: await getHASHLen(id, key),
      }
      break
    }

    case 'STREAM': {
      nextValueState.value = {
        data: await getSTREAMData(id, key),
        lenght: await getSTREAMLen(id, key),
      }
      break
    }

    case 'SET': {
      nextValueState.value = {
        data: await getSETData(id, key),
        length: await getSETLen(id, key),
      }
      break
    }

    case 'ZSET': {
      nextValueState.value = {
        data: await getZSETData(id, key),
        length: await getZSETLen(id, key),
      }
      break
    }

    case 'LIST': {
      nextValueState.value = {
        data: await getLISTData(id, key, parmas),
        length: await getLISTLen(id, key),
      }
      break
    }

    default:
      nextValueState.value = await getSTRINGData(id, key)
      break
  }
  return nextValueState
}
