import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)

const version = process.env.RDS_VERSION?.replace('v', '')
if (!version) {
  throw new Error('RDS_VERSION environment variable not set')
}

// Rewrite tauri version
const tauriConfigPath = path.join(
  path.dirname(__filename),
  '../desktop/tauri.conf.json'
)
const tauriConfig = JSON.parse(fs.readFileSync(tauriConfigPath, 'utf8'))

tauriConfig.version = version

console.log('Writing version ' + version + ' to ' + tauriConfigPath)
fs.writeFileSync(tauriConfigPath, JSON.stringify(tauriConfig, null, 2))

// Rewrite cli version
const cliPackageJsonPath = path.join(
  path.dirname(__filename),
  '../cli/package.json'
)
const cliPackageJson = JSON.parse(fs.readFileSync(cliPackageJsonPath, 'utf8'))

cliPackageJson.version = version

console.log('Writing version ' + version + ' to ' + cliPackageJsonPath)
fs.writeFileSync(cliPackageJsonPath, JSON.stringify(cliPackageJson, null, 2))
