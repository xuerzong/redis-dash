import fs from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'

const rootDir = process.cwd()
const sourceDir = path.resolve(rootDir, 'app', 'dist')
const targetRootDir = path.resolve(rootDir, 'cli', 'dist')
const targetDir = path.resolve(targetRootDir, 'app')

const main = async () => {
  if (!existsSync(sourceDir)) {
    throw new Error(`Missing source app directory: ${sourceDir}`)
  }

  await fs.mkdir(targetRootDir, { recursive: true })
  await fs.rm(targetDir, { recursive: true, force: true })
  await fs.cp(sourceDir, targetDir, { recursive: true })
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
