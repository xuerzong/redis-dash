import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const version = process.env.RDS_VERSION?.replace('v', '')
if (!version) {
  throw new Error('RDS_VERSION environment variable not set')
}

// Rewrite tauri version
const tauriConfigPath = path.join(__dirname, '../desktop/tauri.conf.json')
const tauriConfig = JSON.parse(fs.readFileSync(tauriConfigPath, 'utf8'))

tauriConfig.version = version

console.log('Writing version ' + version + ' to ' + tauriConfigPath)
fs.writeFileSync(tauriConfigPath, JSON.stringify(tauriConfig, null, 2))
