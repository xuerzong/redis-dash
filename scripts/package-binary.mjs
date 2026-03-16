import fs from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'

const rootDir = process.cwd()
const cliDistDir = path.resolve(rootDir, 'cli', 'dist')
const platformId =
  process.env.RDS_PLATFORM_ID || `${process.platform}-${process.arch}`
const binaryName =
  process.env.RDS_BINARY_NAME ||
  (process.platform === 'win32' ? 'rds.exe' : 'rds')

const sourceBinaryPath = path.resolve(
  cliDistDir,
  'native',
  platformId,
  binaryName
)
const sourceAppPath = path.resolve(cliDistDir, 'app')
const releaseDir = path.resolve(cliDistDir, 'binary', platformId)

const main = async () => {
  if (!existsSync(sourceBinaryPath)) {
    throw new Error(`Missing native binary: ${sourceBinaryPath}`)
  }

  if (!existsSync(path.resolve(sourceAppPath, 'index.html'))) {
    throw new Error(`Missing packaged app assets: ${sourceAppPath}`)
  }

  await fs.rm(releaseDir, { recursive: true, force: true })
  await fs.mkdir(releaseDir, { recursive: true })
  await fs.copyFile(sourceBinaryPath, path.resolve(releaseDir, binaryName))
  await fs.chmod(path.resolve(releaseDir, binaryName), 0o755)
  await fs.cp(sourceAppPath, path.resolve(releaseDir, 'app'), {
    recursive: true,
  })
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
