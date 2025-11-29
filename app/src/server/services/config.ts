import { CACHE_PATH } from '@server/constants/path'
import path from 'node:path'
import fs from 'node:fs/promises'
import type { Config } from '@/types'

const configPath = path.resolve(CACHE_PATH, 'config.json')

export const getConfig = async () => {
  try {
    const config = await fs.readFile(configPath, 'utf-8')
    return JSON.parse(config)
  } catch {
    return null
  }
}

export const setConfig = async (config: Config) => {
  return fs.writeFile(configPath, JSON.stringify(config))
}
