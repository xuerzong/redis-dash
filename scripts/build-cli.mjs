import { build } from 'esbuild'
import path from 'node:path'
import fs from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

const rootDir = process.cwd()
const workspaceRoot = path.resolve(rootDir, '..')

const binaryName =
  process.env.RDS_BINARY_NAME ||
  (process.platform === 'win32' ? 'rds.exe' : 'rds')
const platformId =
  process.env.RDS_PLATFORM_ID || `${process.platform}-${process.arch}`
const cargoTarget = process.env.CARGO_BUILD_TARGET
const skipNativeBuild = process.env.RDS_SKIP_NATIVE_BUILD === '1'

const sourceBinaryPath = path.resolve(
  workspaceRoot,
  'native',
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
const distCliPath = path.resolve(rootDir, 'dist', 'cli.js')

const buildNativeBinary = () => {
  const args = [
    'build',
    '--release',
    '--manifest-path',
    path.resolve(workspaceRoot, 'native', 'Cargo.toml'),
    '-p',
    'rds-native',
  ]

  if (cargoTarget) {
    args.push('--target', cargoTarget)
  }

  const result = spawnSync('cargo', args, {
    cwd: workspaceRoot,
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
  if (!skipNativeBuild) {
    buildNativeBinary()
  }

  await build({
    entryPoints: [path.resolve(rootDir, 'src', 'index.ts')],
    bundle: true,
    minify: true,
    outfile: path.resolve(rootDir, 'dist', 'cli.js'),
    format: 'cjs',
    platform: 'node',
    banner: {
      js: '#!/usr/bin/env node',
    },
  })

  if (process.platform !== 'win32') {
    await fs.chmod(distCliPath, 0o755)
  }

  if (!skipNativeBuild) {
    await fs.mkdir(path.dirname(distBinaryPath), { recursive: true })
    await fs.copyFile(sourceBinaryPath, distBinaryPath)
    await fs.chmod(distBinaryPath, 0o755)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
