import path from 'node:path'
import fs from 'node:fs/promises'
import type { BaseHandlerFunc, HandlerFunc, HttpResponse } from './types'
import { ok } from '@/server/lib/response'
import { ASSETS_PATH, CLIENT_PATH } from '../constants/path'

const responseFile = async (res: HttpResponse, filePath: string) => {
  const content = await fs.readFile(filePath)
  const ext = path.extname(filePath).toLowerCase()
  const contentTypeMap: {
    [key: string]: string
  } = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
  }
  const contentType = contentTypeMap[ext] || 'application/octet-stream'
  return ok(res, content, { 'content-type': contentType })
}

export const httpStaticHandler: BaseHandlerFunc =
  (next?: HandlerFunc) => async (req, res) => {
    if (req.url === '/favicon.png') {
      return responseFile(res, path.resolve(CLIENT_PATH, 'favicon.png'))
    }

    if (!req.url?.startsWith('/assets/')) {
      return next?.(req, res)
    }

    const relativePath = req.url.slice('/assets/'.length)
    const filePath = path.resolve(ASSETS_PATH, relativePath)

    try {
      const stats = await fs.stat(filePath)
      if (!stats.isFile() || !filePath.startsWith(ASSETS_PATH)) {
        return next?.(req, res)
      }
    } catch {
      return next?.(req, res)
    }

    try {
      return responseFile(res, filePath)
    } catch (err) {
      console.error('Static Server Error:', err)
      return next?.(req, res)
    }
  }
