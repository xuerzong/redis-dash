import fs from 'node:fs/promises'
import path from 'node:path'

const rootDir = process.cwd()
const sourcePath = path.resolve(rootDir, 'README.md')
const targetPath = path.resolve(rootDir, 'cli', 'README.md')

const main = async () => {
  await fs.copyFile(sourcePath, targetPath)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
