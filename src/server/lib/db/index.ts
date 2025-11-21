import { Database } from './client'
import connectionDb from '@/server/lib/db/connections'

export const initDatabase = async () => {
  await Database.init()
  await connectionDb.init()
}

export { connectionDb }
