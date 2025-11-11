import { ConnectionData } from '../schemas/connection'
import { Database } from './client'

const db = new Database<ConnectionData>('connections')

export default db
