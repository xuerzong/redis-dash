import { Database } from './client'
import connectionDb from '@/server/lib/db/connections'

export const initDatabase = () => {
  Database.init()
  connectionDb.init()
}

export { connectionDb }
