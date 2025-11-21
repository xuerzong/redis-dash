import fs from 'node:fs/promises'

export const ensureDir = async (path: string) => {
  try {
    await fs.mkdir(path, { recursive: true })
  } catch (err) {
    console.error(err)
  }
}

export const safeReadFile = async (path?: string) => {
  if (!path) {
    return null
  }
  try {
    return fs.readFile(path, 'utf8')
  } catch (err) {
    console.error(err)
    throw err
  }
}
