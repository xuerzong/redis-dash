import fs from 'node:fs/promises'

export const ensureDir = async (path: string) => {
  try {
    await fs.mkdir(path, { recursive: true })
  } catch (err) {
    console.error(err)
  }
}
