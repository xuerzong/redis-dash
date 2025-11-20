import { WSRouter } from '@/server/lib/router'
import { connectionDb } from '@/server/lib/db'
import { redisMap } from '@/server/lib/redisMap'

const router = new WSRouter()

router.get('/api/connections', async () => {
  return connectionDb.findMany()
})

router.get('/api/connections/status', async (req) => {
  const { id } = req.query
  const connection = await connectionDb.find(id)
  if (!connection) return -1
  // To init the redis instance
  redisMap.getInstance(connection)
  return redisMap.getInstanceStatus(connection)
})

router.post('/api/connections', async (req) => {
  const data = req.body as any
  await connectionDb.insert(data)
})

router.put('/api/connections/:id', async (req) => {
  const { id } = req.params
  const data = req.body as any
  return connectionDb.update(id, data)
})

router.del('/api/connections/:id', async (req) => {
  const { id } = req.params
  return connectionDb.del(id)
})

export { router }
