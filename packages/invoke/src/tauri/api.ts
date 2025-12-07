import {
  BaseDirectory,
  readDir,
  readTextFile,
  writeFile,
  remove,
} from '@tauri-apps/plugin-fs'
import { nanoid } from 'nanoid'
import { invoke } from './invoke'

const systemConfigPath = '.redis-studio-cache/config.json'
const connectionsDirPath = '.redis-studio-cache/db/connections'

export const createConnection = async (data: any) => {
  const id = nanoid(8)
  await writeFile(
    `${connectionsDirPath}/${id}.json`,
    new TextEncoder().encode(JSON.stringify(data)),
    {
      baseDir: BaseDirectory.Home,
    }
  )
  return id
}

export const getConnections = async () => {
  const connections: any[] = []
  try {
    const entries = await readDir(connectionsDirPath, {
      baseDir: BaseDirectory.Home,
    })
    for (const entry of entries) {
      if (entry.isFile) {
        const entryContent = await readTextFile(
          `${connectionsDirPath}/${entry.name}`,
          {
            baseDir: BaseDirectory.Home,
          }
        )
        connections.push({
          ...JSON.parse(entryContent),
          id: entry.name.replace('.json', ''),
        })
      }
    }
    return connections
  } catch (e) {
    console.log(e)
    return []
  }
}

export const getConnectionById = async (id: string) => {
  try {
    const content = await readTextFile(`${connectionsDirPath}/${id}.json`, {
      baseDir: BaseDirectory.Home,
    })
    return JSON.parse(content)
  } catch {
    throw new Error(`No connection found with ID: ${id}`)
  }
}

export const updateConnection = async (id: string, data: any) => {
  await writeFile(
    `${connectionsDirPath}/${id}.json`,
    new TextEncoder().encode(JSON.stringify(data)),
    {
      baseDir: BaseDirectory.Home,
    }
  )
  return id
}

export const delConnection = async (id: string) => {
  await remove(`${connectionsDirPath}/${id}.json`, {
    baseDir: BaseDirectory.Home,
  })
}

export const getConnectionStatus = async (id: string) => {
  console.log(id)
  return 0
}

export const postDisconnectConnection = async (id: string) => {
  return invoke('close_redis_command', {
    redisConfig: await getConnectionById(id),
  })
}

export const getSystemConfig = async () => {
  try {
    const systemConfigContent = await readTextFile(systemConfigPath, {
      baseDir: BaseDirectory.Home,
    })
    return JSON.parse(systemConfigContent)
  } catch (e) {
    console.error(e)
    return {}
  }
}

export const setSystemConfig = async (config: any) => {
  await writeFile(
    systemConfigPath,
    new TextEncoder().encode(JSON.stringify(config)),
    {
      baseDir: BaseDirectory.Home,
    }
  )
}
