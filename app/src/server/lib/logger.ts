import { Console } from 'node:console'
import picocolors from 'picocolors'

const { blue, green, red, yellow, bold } = picocolors

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

export default logger
