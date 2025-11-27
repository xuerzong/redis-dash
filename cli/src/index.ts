import path from 'node:path'
import { spawn } from 'cross-spawn'
import fs from 'node:fs'
import treeKill from 'tree-kill'
import picocolors from 'picocolors'
import mri from 'mri'
import { printCli, printRectangleWithCenteredText } from './utils'
import { packageJson } from './package'
const { green, red, yellow, bgGreen, bgRed } = picocolors

const argv = mri<{
  port?: number
  version?: boolean
  help?: boolean
}>(process.argv.slice(2), {
  boolean: ['version', 'help'],
  alias: { v: 'version', h: 'help' },
  string: ['port'],
})

const helpMessage = `\
Usage: rds [options] [command]

${packageJson.description}

Options:

-v, --version       output the version number
-h, --help          display help for command


Commands:

start [options]\t\tstart rds in background
restart [options]\tstop then start redis-studio background server
stop\t\t\tstop rds background server and its children
status\t\t\tcheck rds status
`

// common js
let DIRNAME = __dirname

const PID_FILE = path.resolve(DIRNAME, 'rs-server.pid')

interface StartServerOptions {
  port: number
}

function startServer(options: StartServerOptions) {
  if (fs.existsSync(PID_FILE)) {
    const pid = fs.readFileSync(PID_FILE, 'utf8').trim()
    console.log(yellow(`Server already seems to be running (PID: ${pid}).`))
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

  console.log(
    `Redis Studio started in background (PID: ${child.pid}) on port ${options.port}`
  )
  console.log(`You can open it in your broswer:\n`)

  printRectangleWithCenteredText(`🚀 http://127.0.0.1:${options.port}`)
  return true
}

const stopServer = async () => {
  console.log('Attempting to stop RDS server...')
  return new Promise((resolve) => {
    if (!fs.existsSync(PID_FILE)) {
      console.log(yellow('RDS server is not running.'))
      return resolve(true)
    }

    const pid = fs.readFileSync(PID_FILE, 'utf8').trim()
    const pidNum = parseInt(pid, 10)

    treeKill(pidNum, 'SIGTERM', (err) => {
      let success = true

      if (err) {
        if (err.message.includes('No such process')) {
          console.log(yellow('No such process.'))
        } else {
          console.log(red('Failed to stop server:'), err.message)
          success = false
        }
      } else {
        console.log(green('Stop RDS successfully.'))
      }

      try {
        fs.unlinkSync(PID_FILE)
      } catch (cleanupErr: any) {
        if (!cleanupErr.message.includes('ENOENT')) {
          console.log(red('Failed to remove PID file:'), cleanupErr.message)
        }
      }

      resolve(success)
    })
  })
}

const getServerStatus = async () => {
  if (!fs.existsSync(PID_FILE)) {
    console.log(bgRed(' ✖ Not Running '))
  } else {
    console.log(bgGreen(' ✔ Running '))
  }
}

const main = async () => {
  const command = argv._[0]

  switch (command) {
    case 'start': {
      const options: StartServerOptions = {
        port: 5090,
      }
      const port = argv.port
      if (port) {
        if (isNaN(Number(port))) {
          console.log(red('The `port` must be a number'))
        } else {
          options.port = port
        }
      }
      printCli()
      startServer(options)
      process.exit(0)
      break
    }
    case 'stop': {
      await stopServer().then((success) => {
        process.exit(success ? 0 : 1)
      })
      break
    }
    case 'restart': {
      await stopServer().then((success) => {
        if (success) {
          startServer({ port: 5090 })
          process.exit(0)
        } else {
          process.exit(1)
        }
      })
      break
    }
    case 'status': {
      await getServerStatus()
      break
    }
    default: {
      if (argv.version) {
        console.log(packageJson.version)
      } else {
        printCli()
        console.log(helpMessage)
      }
    }
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
  process.exit(1)
})
