import type { BaseHandlerFunc } from './types'
import fs from 'node:fs/promises'
import { ok, serverError } from '@/server/lib/response'
import { HTML_PATH } from '@/server/constants/path'

export const httpHtmlHanlder: BaseHandlerFunc =
  () => async (_req, res, _next) => {
    try {
      await fs.access(HTML_PATH)

      const template = await fs.readFile(HTML_PATH, 'utf-8')
      const html = template

      return ok(res, html, { 'content-type': 'text/html' })
    } catch (err) {
      console.error(err)
      return serverError(res)
    }
  }
