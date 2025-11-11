import { Command } from 'commander'
import path from 'node:path'
import { spawn } from 'child_process'
import fs from 'node:fs'
import treeKill from 'tree-kill'
import picocolors from 'picocolors'

const { green, red, yellow, bold } = picocolors

export const log = {
  normal(...args: any[]) {
    console.log(...args)
  },
  success(...args: any[]) {
    console.log(green('✔'), ...args)
  },
  error(...args: any[]) {
    console.log(red('✖'), ...args)
  },
  warning(...args: any[]) {
    console.log(bold(yellow('!')), ...args)
  },
}

const program = new Command()

const rootDir = process.cwd()
const PID_FILE = path.resolve(rootDir, 'hs-server.pid')

program
  .name('hs')
  .description('CLI to some JavaScript string utilities')
  .version('0.0.0')

function startServer(options: { port: number }) {
  if (fs.existsSync(PID_FILE)) {
    const pid = fs.readFileSync(PID_FILE, 'utf8').trim()
    log.error(`Server already seems to be running (PID: ${pid}).`)
    return false
  }

  const serverJsPath = path.resolve(rootDir, 'dist', 'server.mjs')
  const env = {
    ...process.env,
    PORT: options.port.toString(),
    NODE_ENV: 'production',
  }

  const child = spawn('node', [serverJsPath], {
    stdio: 'ignore',
    detached: true,
    env,
  })

  const pid = child.pid?.toString()
  if (pid) {
    fs.writeFileSync(PID_FILE, pid)
  }

  child.unref()

  log.success(
    `Redis Studio started in background (PID: ${child.pid}) on port ${options.port}`
  )
  log.normal(`You can open it in your broswer:`)
  log.normal('>', green(`http://127.0.0.1:${options.port}`))

  return true
}

function stopServer() {
  return new Promise((resolve) => {
    if (!fs.existsSync(PID_FILE)) {
      log.normal('hs server is not running or PID file is missing.')
      return resolve(true)
    }

    const pid = fs.readFileSync(PID_FILE, 'utf8').trim()
    const pidNum = parseInt(pid, 10)

    console.log(`Attempting to stop hs server (PID: ${pidNum})...`)

    treeKill(pidNum, 'SIGTERM', (err) => {
      let success = true

      if (err) {
        if (err.message.includes('No such process')) {
          log.warning(
            `Process (PID: ${pidNum}) not found. Cleaning up PID file.`
          )
        } else {
          log.error('Failed to stop server:', err.message)
          success = false
        }
      } else {
        log.success(
          `hs server (PID: ${pidNum}) and its children have been terminated.`
        )
      }

      try {
        fs.unlinkSync(PID_FILE)
      } catch (cleanupErr: any) {
        if (!cleanupErr.message.includes('ENOENT')) {
          log.error('Failed to remove PID file:', cleanupErr.message)
        }
      }

      resolve(success)
    })
  })
}

program
  .command('start')
  .description('start hs in background')
  .option('-p, --port <number>', 'Server Port', '5090')
  .action((options) => {
    startServer(options)
    process.exit(0)
  })

program
  .command('stop')
  .description('stop hs background server and its children')
  .action(async () => {
    const success = await stopServer()
    process.exit(success ? 0 : 1)
  })

program
  .command('restart')
  .description('stop then start hs background server')
  .option('-p, --port <number>', 'Server Port', '5090')
  .action(async (options) => {
    console.log('--- Restarting Server ---')
    const stopSuccess = await stopServer()

    if (stopSuccess) {
      console.log('\n--- Starting New Server ---')
      startServer(options)
    } else {
      log.error('Stop failed. Aborting new server start.')
    }

    process.exit(0)
  })

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
  process.exit(1)
})

program.parse()
