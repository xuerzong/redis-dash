import { Console } from 'node:console'
import fs from 'node:fs/promises'
import path from 'node:path'
import picocolors from 'picocolors'

const { blue, green, red, yellow, bold } = picocolors

const rootDir = process.cwd()
const logFilePath = path.resolve(rootDir, 'a.log')
async function writeLog(message: string, level = 'info') {
  try {
    const timestamp = new Date().toISOString()
    const logLine = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`
    await fs.appendFile(logFilePath, logLine)
    console.log(logLine.trim())
  } catch (error) {
    console.error('写入日志失败:', error)
  }
}

export const log = (message: string) => {
  writeLog(message)
}

class Logger extends Console {
  log(...args: any[]): void {
    super.log(blue(`[${[new Date().toLocaleString()]}]`), green('✔'), ...args)
  }
  warn(...args: any[]): void {
    super.log(
      blue(`[${[new Date().toLocaleString()]}]`),
      bold(yellow('!')),
      ...args
    )
  }
  error(...args: any[]): void {
    super.log(blue(`[${[new Date().toLocaleString()]}]`), red('✖'), ...args)
  }
}

export const logger = new Logger({
  stdout: process.stdout,
  stderr: process.stderr,
})
