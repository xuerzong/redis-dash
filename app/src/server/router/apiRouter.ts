import { WSRouter } from '@server/lib/router'
import { connectionDb } from '@server/lib/db'
import { redisMap } from '@server/lib/redisMap'
import { getConfig, setConfig } from '@server/services/config'
import type { Config } from '@/types'

const router = new WSRouter()

router.get('/api/connections', async () => {
  return connectionDb.findMany()
})

router.get('/api/connections/status', async (req) => {
  const { id } = req.query
  const connection = await connectionDb.find(id)
  if (!connection) return -1
  // To init the redis instance
  await redisMap.getInstance(connection)
  return redisMap.getInstanceStatus(connection)
})

router.post('/api/connections', async (req) => {
  const data = req.body as any
  return connectionDb.insert(data)
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

router.post('/api/connections/:id/disconnect', async (req) => {
  const { id } = req.params
  const connection = await connectionDb.find(id)
  if (!connection) return null
  await redisMap.closeInstance(connection)
})

router.get('/api/config', async () => {
  return getConfig()
})

router.post('/api/config', async (req) => {
  return setConfig(req.body as Config)
})

export { router }
