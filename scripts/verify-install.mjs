import fs from 'node:fs/promises'
import { existsSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawn, spawnSync } from 'node:child_process'

const rootDir = process.cwd()
const platformId = `${process.platform}-${process.arch}`
const archiveName = `rds-${platformId}.tar.gz`
const archivePath = path.resolve(rootDir, 'dist', 'binary', archiveName)
const installScriptPath = path.resolve(rootDir, 'scripts', 'install.sh')

const assertExists = (targetPath, label) => {
  if (!existsSync(targetPath)) {
    throw new Error(`Missing ${label}: ${targetPath}`)
  }
}

const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, {
    cwd: rootDir,
    stdio: 'inherit',
    ...options,
  })

  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(' ')} failed with code ${result.status}`
    )
  }
}

const waitForServer = async (port) => {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const result = spawnSync(
      'curl',
      [`http://127.0.0.1:${port}/latest/${archiveName}`],
      {
        cwd: rootDir,
        stdio: 'ignore',
      }
    )

    if (result.status === 0) {
      return
    }

    await new Promise((resolve) => setTimeout(resolve, 200))
  }

  throw new Error('Timed out waiting for local archive server to start.')
}

const main = async () => {
  assertExists(archivePath, 'binary archive')
  assertExists(installScriptPath, 'install script')

  const tempRoot = await fs.mkdtemp(
    path.join(os.tmpdir(), 'rds-install-verify-')
  )
  const serverRoot = path.join(tempRoot, 'server')
  const latestDir = path.join(serverRoot, 'latest')
  const installRoot = path.join(tempRoot, 'install-root')
  const binDir = path.join(tempRoot, 'bin')
  const patchedInstallScript = path.join(tempRoot, 'install.sh')
  const expectedBinary = path.join(installRoot, 'rds')
  const expectedAppIndex = path.join(installRoot, 'app', 'index.html')
  const linkedBinary = path.join(binDir, 'rds')
  const port = 18990

  await fs.mkdir(latestDir, { recursive: true })
  await fs.mkdir(binDir, { recursive: true })
  await fs.copyFile(archivePath, path.join(latestDir, archiveName))

  const installScript = await fs.readFile(installScriptPath, 'utf8')
  await fs.writeFile(
    patchedInstallScript,
    installScript.replace(
      'DEFAULT_BASE_URL="https://download.xuco.me/redis-dash"',
      `DEFAULT_BASE_URL="http://127.0.0.1:${port}"`
    ),
    'utf8'
  )
  await fs.chmod(patchedInstallScript, 0o755)

  const server = spawn(
    'python3',
    ['-m', 'http.server', String(port), '--directory', serverRoot],
    {
      cwd: rootDir,
      stdio: 'ignore',
    }
  )

  try {
    await waitForServer(port)

    run('sh', [patchedInstallScript], {
      env: {
        ...process.env,
        RDS_INSTALL_ROOT: installRoot,
        RDS_BIN_DIR: binDir,
      },
    })

    assertExists(expectedBinary, 'installed binary')
    assertExists(expectedAppIndex, 'installed app assets')
    assertExists(linkedBinary, 'linked binary')

    run(linkedBinary, ['--version'], {
      env: {
        ...process.env,
        PATH: `${binDir}:${process.env.PATH ?? ''}`,
      },
    })
  } finally {
    server.kill('SIGTERM')
    await fs.rm(tempRoot, { recursive: true, force: true })
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
