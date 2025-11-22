import type { BaseHandlerFunc, HandlerFunc } from './types'
import formidable from 'formidable'
import { json, notFound, serverError } from '@/server/lib/response'
import path from 'node:path'
import fs from 'node:fs/promises'
import { dirname } from '@/utils/dirname'
import { ensureDir } from '@/utils/fs'

const UPLOAD_DIR = path.resolve(
  process.env.NODE_ENV === 'dev' ? process.cwd() : dirname,
  'uploads'
)

export const httpUploadFileHandler: BaseHandlerFunc =
  (next?: HandlerFunc) => async (req, res) => {
    if (req.url === '/upload' && req.method === 'POST') {
      await ensureDir(UPLOAD_DIR)
      try {
        const form = formidable({
          uploadDir: UPLOAD_DIR,
          keepExtensions: true,
          maxFileSize: 20 * 1024 * 1024,
        })
        const { files } = await new Promise<{
          fields: formidable.Fields<string>
          files: formidable.Files<string>
        }>((resolve, reject) => {
          form.parse(req, async (err, fields, files) => {
            if (err) {
              return reject(err)
            }
            resolve({ files, fields })
          })
        })

        const uploadedFile = files.file
          ? Array.isArray(files.file)
            ? files.file[0]
            : files.file
          : null

        if (!uploadedFile) {
          return notFound(res)
        }

        if (uploadedFile) {
          const oldPath = uploadedFile.filepath
          const newFileName = uploadedFile.originalFilename!
          const newPath = path.resolve(UPLOAD_DIR, newFileName)
          await fs.rename(oldPath, newPath)
          return json(res, { url: newPath })
        }
      } catch (e: any) {
        return serverError(res, e.message)
      }
    }

    return next?.(req, res)
  }
