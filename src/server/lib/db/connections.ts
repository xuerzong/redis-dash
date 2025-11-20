import { Database } from './client'

export type ConnectionData = {
  host: string
  username: string
  password: string
  port: number
}

const db = new Database<ConnectionData>('connections')

export default db
