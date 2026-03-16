import path from 'node:path'
import fs from 'node:fs'
import { spawn } from 'node:child_process'

const port = parseInt(process.env.PORT || '5090')

const resolveNativeBinary = () => {
  const envBinary = process.env.RDS_SERVER_BIN
  const candidates = [
    envBinary,
    path.resolve(__dirname, '../bin/rds'),
    path.resolve(__dirname, '../bin/rds.exe'),
    path.resolve(__dirname, '../../native/target/release/rds'),
    path.resolve(__dirname, '../../native/target/release/rds.exe'),
  ].filter(Boolean) as string[]

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate
    }
  }

  throw new Error('Unable to locate native `rds` binary.')
}

const bootstrap = async () => {
  const binary = resolveNativeBinary()
  const child = spawn(
    binary,
    ['serve', '--port', String(port), '--asset-root', __dirname],
    {
      stdio: 'inherit',
      env: {
        ...process.env,
        RDS_ASSET_ROOT: __dirname,
      },
    }
  )

  child.on('exit', (code) => {
    process.exit(code ?? 0)
  })

  child.on('error', (error) => {
    console.error(error)
    process.exit(1)
  })

  process.on('SIGINT', () => {
    child.kill('SIGINT')
  })

  process.on('SIGTERM', () => {
    child.kill('SIGTERM')
  })
}

bootstrap().catch((error) => {
  console.error(error)
  process.exit(1)
})
