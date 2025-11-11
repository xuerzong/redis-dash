export type RedisStateValue = {
  HASH: {
    data: string[]
    length: number
  }
  STREAM: {
    data: [string, string[]][]
    length: number
  }
  SET: {
    data: string[]
    length: number
  }
  ZSET: {
    data: string[]
    length: number
  }
  LIST: {
    data: string[]
    length: number
  }
  STRING: string
}
