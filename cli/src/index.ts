import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const binaryName = process.platform === 'win32' ? 'rds.exe' : 'rds'
const platformId = `${process.platform}-${process.arch}`

const resolveBinaryPath = () => {
  const envBinary = process.env.RDS_NATIVE_BIN
  const candidates = [
    envBinary,
    path.resolve(__dirname, 'native', platformId, binaryName),
    path.resolve(__dirname, 'native', binaryName),
    path.resolve(__dirname, '../native/target/release', binaryName),
    path.resolve(__dirname, '../../native/target/release', binaryName),
  ].filter(Boolean) as string[]

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate
    }
  }

  throw new Error(
    `Unable to locate native CLI binary for ${platformId}. Expected ${binaryName}. The npm postinstall step should download this file. You can reinstall with RDS_BINARY_MIRROR or RDS_BINARY_URL to use a custom mirror.`
  )
}

const resolveAssetRoot = () => {
  const envAssetRoot = process.env.RDS_ASSET_ROOT
  const candidates = [
    envAssetRoot,
    path.resolve(__dirname, 'app'),
    path.resolve(process.cwd(), 'app', 'dist'),
    path.resolve(process.cwd(), 'dist', 'app'),
  ].filter(Boolean) as string[]

  for (const candidate of candidates) {
    if (fs.existsSync(path.resolve(candidate, 'index.html'))) {
      return candidate
    }
  }

  throw new Error('Unable to locate app assets. Expected an `index.html` file.')
}

const main = () => {
  const binaryPath = resolveBinaryPath()
  const assetRoot = resolveAssetRoot()

  const result = spawnSync(binaryPath, process.argv.slice(2), {
    stdio: 'inherit',
    env: {
      ...process.env,
      RDS_ASSET_ROOT: assetRoot,
    },
  })

  if (result.error) {
    throw result.error
  }

  process.exit(result.status ?? 0)
}

main()
