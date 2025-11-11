export type ConnectionData = {
  host: string
  username: string
  password: string
  port: string
}

export type ConnectionOutput = ConnectionData & {
  id: string
}
