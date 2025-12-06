import {
  BaseDirectory,
  readDir,
  readTextFile,
  writeFile,
  remove,
} from '@tauri-apps/plugin-fs'
import { nanoid } from 'nanoid'

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
