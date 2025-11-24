import { fileURLToPath } from 'node:url'
import path from 'node:path'

let dirname = __dirname

if (typeof dirname === 'undefined') {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)
  dirname = __dirname
}

export { dirname }
