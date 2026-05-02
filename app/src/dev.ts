import path from 'node:path'
import { spawn, type ChildProcess } from 'node:child_process'
import { createServer, type ViteDevServer } from 'vite'

const rootPath = process.cwd()
const port = parseInt(process.env.PORT || '5090', 10)
const backendPort = parseInt(
  process.env.RDS_BACKEND_PORT || String(port + 1),
  10
)

if (port === backendPort) {
  throw new Error('PORT and RDS_BACKEND_PORT must be different in dev mode.')
}

const cargoManifestPath = path.resolve(rootPath, '../crates/Cargo.toml')
const backendUrl = `http://127.0.0.1:${backendPort}`

const waitForBackendReady = (backend: ChildProcess) =>
  new Promise<void>((resolve, reject) => {
    let settled = false

    const finish = (callback: () => void) => {
      if (settled) {
        return
      }
      settled = true
      callback()
    }

    const handleOutput = (
      chunk: string | Buffer,
      writer: NodeJS.WriteStream
    ) => {
      const text = chunk.toString()
      writer.write(text)
      if (text.includes('The server is running at')) {
        finish(resolve)
      }
    }

    backend.stdout?.on('data', (chunk) => handleOutput(chunk, process.stdout))
    backend.stderr?.on('data', (chunk) => handleOutput(chunk, process.stderr))

    backend.once('error', (error) => {
      finish(() => reject(error))
    })

    backend.once('exit', (code) => {
      finish(() => {
        reject(
          new Error(
            `Rust dev server exited before ready with code ${code ?? 0}.`
          )
        )
      })
    })
  })

const startBackend = () => {
  const backend = spawn(
    'cargo',
    [
      'run',
      '--manifest-path',
      cargoManifestPath,
      '-p',
      'rds-native',
      '--',
      'serve',
      '--port',
      String(backendPort),
      '--asset-root',
      rootPath,
    ],
    {
      cwd: rootPath,
      stdio: ['inherit', 'pipe', 'pipe'],
      env: {
        ...process.env,
        RDS_ASSET_ROOT: rootPath,
      },
    }
  )

  return backend
}

const startVite = async () => {
  const vite = await createServer({
    configFile: path.resolve(rootPath, 'vite.config.ts'),
    server: {
      host: '127.0.0.1',
      port,
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
        },
        '/upload': {
          target: backendUrl,
          changeOrigin: true,
        },
        '/ws': {
          target: backendUrl,
          changeOrigin: true,
          ws: true,
        },
      },
    },
  })

  await vite.listen()
  vite.printUrls()
  return vite
}

const bootstrap = async () => {
  let vite: ViteDevServer | undefined
  const backend = startBackend()
  let shuttingDown = false

  const shutdown = async (signal: NodeJS.Signals = 'SIGTERM') => {
    if (shuttingDown) {
      return
    }
    shuttingDown = true

    await vite?.close()

    if (backend.exitCode === null && !backend.killed) {
      backend.kill(signal)
    }
  }

  backend.once('error', async (error) => {
    console.error(error)
    await shutdown()
    process.exit(1)
  })

  backend.once('exit', async (code) => {
    if (shuttingDown) {
      return
    }
    console.error(`Rust dev server exited with code ${code ?? 0}.`)
    await shutdown()
    process.exit(code ?? 1)
  })

  process.once('SIGINT', async () => {
    await shutdown('SIGINT')
    process.exit(0)
  })

  process.once('SIGTERM', async () => {
    await shutdown('SIGTERM')
    process.exit(0)
  })

  await waitForBackendReady(backend)
  vite = await startVite()

  console.log(`Rust backend proxy target: ${backendUrl}`)
}

bootstrap().catch((error) => {
  console.error(error)
  process.exit(1)
})
