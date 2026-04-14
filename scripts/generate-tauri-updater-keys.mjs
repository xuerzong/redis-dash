import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import readline from 'node:readline'
import { spawn } from 'node:child_process'

const args = process.argv.slice(2)

const getArgValue = (name) => {
  const exact = `--${name}`
  const prefix = `--${name}=`

  for (let index = 0; index < args.length; index += 1) {
    const value = args[index]
    if (value === exact) {
      return args[index + 1]
    }
    if (value.startsWith(prefix)) {
      return value.slice(prefix.length)
    }
  }

  return undefined
}

const hasFlag = (name) => args.includes(`--${name}`)

const defaultKeyPath = path.join(os.homedir(), '.tauri', 'redis-dash.key')

const printUsage = () => {
  console.log(`Usage:
  node ./scripts/generate-tauri-updater-keys.mjs
  node ./scripts/generate-tauri-updater-keys.mjs --key-path ~/.tauri/redis-dash.key
  node ./scripts/generate-tauri-updater-keys.mjs --show-only

Options:
  --key-path <path>  Key file location. Defaults to ~/.tauri/redis-dash.key
  --show-only        Do not generate. Only read existing key files and print secret values.
  --force            Regenerate even if key files already exist.
  --help             Show this help message.
`)
}

const resolveKeyPath = () => {
  const input = getArgValue('key-path') || defaultKeyPath
  if (input.startsWith('~/')) {
    return path.join(os.homedir(), input.slice(2))
  }
  return path.resolve(input)
}

const askYesNo = async (question) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  const answer = await new Promise((resolve) => {
    rl.question(question, resolve)
  })

  rl.close()
  return ['y', 'yes'].includes(String(answer).trim().toLowerCase())
}

const fileExists = async (filePath) => {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

const runSignerGenerate = async (keyPath) => {
  await fs.mkdir(path.dirname(keyPath), { recursive: true })

  await new Promise((resolve, reject) => {
    const child = spawn(
      process.platform === 'win32' ? 'npx.cmd' : 'npx',
      ['tauri', 'signer', 'generate', '-w', keyPath],
      {
        cwd: path.resolve(process.cwd(), 'desktop'),
        stdio: 'inherit',
        env: process.env,
      }
    )

    child.on('error', reject)
    child.on('close', (code) => {
      if (code === 0) {
        resolve()
        return
      }
      reject(new Error(`tauri signer generate exited with code ${code}`))
    })
  })
}

const main = async () => {
  if (hasFlag('help')) {
    printUsage()
    return
  }

  const keyPath = resolveKeyPath()
  const publicKeyPath = `${keyPath}.pub`
  const showOnly = hasFlag('show-only')
  const force = hasFlag('force')

  const hasPrivateKey = await fileExists(keyPath)
  const hasPublicKey = await fileExists(publicKeyPath)

  if (!showOnly) {
    if ((hasPrivateKey || hasPublicKey) && !force) {
      const shouldReuse = await askYesNo(
        `Key files already exist at ${keyPath}. Reuse them instead of regenerating? [Y/n] `
      )

      if (!shouldReuse) {
        await runSignerGenerate(keyPath)
      }
    } else if (!hasPrivateKey || !hasPublicKey || force) {
      await runSignerGenerate(keyPath)
    }
  }

  const privateKey = (await fs.readFile(keyPath, 'utf8')).trim()
  const publicKey = (await fs.readFile(publicKeyPath, 'utf8')).trim()

  console.log('')
  console.log('GitHub Actions secrets:')
  console.log('')
  console.log('TAURI_SIGNING_PRIVATE_KEY')
  console.log(privateKey)
  console.log('')
  console.log('TAURI_SIGNING_PUBLIC_KEY')
  console.log(publicKey)
  console.log('')
  console.log('TAURI_SIGNING_PRIVATE_KEY_PASSWORD')
  console.log('Use the password you entered during `tauri signer generate`.')
  console.log('')
  console.log('Files:')
  console.log(`Private key: ${keyPath}`)
  console.log(`Public key: ${publicKeyPath}`)
  console.log('')
  console.log(
    'GitHub path: Settings -> Secrets and variables -> Actions -> New repository secret'
  )
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
