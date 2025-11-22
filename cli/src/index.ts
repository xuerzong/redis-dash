import { Command } from 'commander'
import path from 'node:path'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import treeKill from 'tree-kill'
import picocolors from 'picocolors'
import { logger } from './logger'
import packageJson from '../package.json' with { type: 'json' }

const { green } = picocolors

const program = new Command()

// common js
let DIRNAME = __dirname

const PID_FILE = path.resolve(DIRNAME, 'rs-server.pid')

program
  .name('redis-studio')
  .description(packageJson.description)
  .version(packageJson.version)

function startServer(options: { port: number }) {
  if (fs.existsSync(PID_FILE)) {
    const pid = fs.readFileSync(PID_FILE, 'utf8').trim()
    logger.error(`Server already seems to be running (PID: ${pid}).`)
    return false
  }

  const serverJsPath = path.resolve(DIRNAME, 'app', 'server.js')
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

  logger.log(
    `Redis Studio started in background (PID: ${child.pid}) on port ${options.port}`
  )
  logger.log(`You can open it in your broswer:`)
  logger.log('>', green(`http://127.0.0.1:${options.port}`))

  return true
}

function stopServer() {
  return new Promise((resolve) => {
    if (!fs.existsSync(PID_FILE)) {
      logger.log('redis-studio server is not running or PID file is missing.')
      return resolve(true)
    }

    const pid = fs.readFileSync(PID_FILE, 'utf8').trim()
    const pidNum = parseInt(pid, 10)

    console.log(`Attempting to stop redis-studio server (PID: ${pidNum})...`)

    treeKill(pidNum, 'SIGTERM', (err) => {
      let success = true

      if (err) {
        if (err.message.includes('No such process')) {
          logger.warn(
            `Process (PID: ${pidNum}) not found. Cleaning up PID file.`
          )
        } else {
          logger.error('Failed to stop server:', err.message)
          success = false
        }
      } else {
        logger.log(
          `redis-studio server (PID: ${pidNum}) and its children have been terminated.`
        )
      }

      try {
        fs.unlinkSync(PID_FILE)
      } catch (cleanupErr: any) {
        if (!cleanupErr.message.includes('ENOENT')) {
          logger.error('Failed to remove PID file:', cleanupErr.message)
        }
      }

      resolve(success)
    })
  })
}

program
  .command('start')
  .description('start redis-studio in background')
  .option('-p, --port <number>', 'Server Port', '5090')
  .action((options) => {
    startServer(options)
    process.exit(0)
  })

program
  .command('stop')
  .description('stop redis-studio background server and its children')
  .action(async () => {
    const success = await stopServer()
    process.exit(success ? 0 : 1)
  })

program
  .command('restart')
  .description('stop then start redis-studio background server')
  .option('-p, --port <number>', 'Server Port', '5090')
  .action(async (options) => {
    console.log('--- Restarting Server ---')
    const stopSuccess = await stopServer()

    if (stopSuccess) {
      console.log('\n--- Starting New Server ---')
      startServer(options)
    } else {
      logger.error('Stop failed. Aborting new server start.')
    }

    process.exit(0)
  })

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
  process.exit(1)
})

program.parse()
