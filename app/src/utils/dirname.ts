import { fileURLToPath } from 'node:url'
import path from 'node:path'

export const getESDirname = () => {
  const __filename = fileURLToPath(import.meta.url)
  return path.dirname(__filename)
}

let dirname = process.env.NODE_ENV === 'dev' ? getESDirname() : __dirname

if (typeof dirname === 'undefined') {
  dirname = getESDirname()
}

export { dirname }
