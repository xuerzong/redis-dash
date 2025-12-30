import path from 'node:path'
import os from 'node:os'
import { dirname } from '@server/utils/dirname'

export const CLIENT_PATH = path.resolve(dirname)

export const ASSETS_PATH = path.resolve(CLIENT_PATH, 'assets')

export const HTML_PATH = path.resolve(CLIENT_PATH, 'index.html')

export const CACHE_PATH = path.resolve(os.homedir(), '.redis-dash-cache')

export const DATABASE_PATH = path.resolve(CACHE_PATH, 'db')
