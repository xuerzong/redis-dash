import path from 'node:path'
import fs from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

const rootDir = process.cwd()

const binaryName =
  process.env.RDS_BINARY_NAME ||
  (process.platform === 'win32' ? 'rds.exe' : 'rds')
const platformId =
  process.env.RDS_PLATFORM_ID || `${process.platform}-${process.arch}`
const cargoTarget = process.env.CARGO_BUILD_TARGET

const sourceBinaryPath = path.resolve(
  rootDir,
  'crates',
  'target',
  ...(cargoTarget ? [cargoTarget] : []),
  'release',
  binaryName
)

const distBinaryPath = path.resolve(
  rootDir,
  'dist',
  'native',
  platformId,
  binaryName
)

const buildNativeBinary = () => {
  const args = [
    'build',
    '--release',
    '--manifest-path',
    path.resolve(rootDir, 'crates', 'Cargo.toml'),
    '-p',
    'rds-native',
  ]

  if (cargoTarget) {
    args.push('--target', cargoTarget)
  }

  const result = spawnSync('cargo', args, {
    cwd: rootDir,
    stdio: 'inherit',
  })

  if (result.status !== 0) {
    throw new Error('Cargo build failed.')
  }

  if (!existsSync(sourceBinaryPath)) {
    throw new Error(`Native binary not found: ${sourceBinaryPath}`)
  }
}

const main = async () => {
  buildNativeBinary()

  await fs.mkdir(path.dirname(distBinaryPath), { recursive: true })
  await fs.copyFile(sourceBinaryPath, distBinaryPath)
  if (process.platform !== 'win32') {
    await fs.chmod(distBinaryPath, 0o755)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
