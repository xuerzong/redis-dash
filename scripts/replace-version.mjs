import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const version = process.env.RDS_VERSION?.replace('v', '')
if (!version) {
  throw new Error('RDS_VERSION environment variable not set')
}

const rewriteCargoPackageVersion = (filePath) => {
  const content = fs.readFileSync(filePath, 'utf8')
  const nextContent = content.replace(
    /(^\[package\][\s\S]*?^version = ")([^"]+)(")/m,
    `$1${version}$3`
  )

  if (nextContent === content) {
    throw new Error(`Failed to update package version in ${filePath}`)
  }

  console.log('Writing version ' + version + ' to ' + filePath)
  fs.writeFileSync(filePath, nextContent)
}

// Rewrite tauri version
const tauriConfigPath = path.join(__dirname, '../desktop/tauri.conf.json')
const tauriConfig = JSON.parse(fs.readFileSync(tauriConfigPath, 'utf8'))

tauriConfig.version = version

console.log('Writing version ' + version + ' to ' + tauriConfigPath)
fs.writeFileSync(tauriConfigPath, JSON.stringify(tauriConfig, null, 2))

rewriteCargoPackageVersion(path.join(__dirname, '../desktop/Cargo.toml'))
rewriteCargoPackageVersion(path.join(__dirname, '../crates/rds/Cargo.toml'))
rewriteCargoPackageVersion(
  path.join(__dirname, '../crates/rds-core/Cargo.toml')
)
