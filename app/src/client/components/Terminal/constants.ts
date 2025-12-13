import { colorize } from './utils'

export const TermColors = {
  Red: '\x1b[31m',
  Green: '\x1b[32m',
  Purple: '\x1b[35m',
  Yellow: '\x1b[33m',
  Blue: '\x1b[34m',
  Cyan: '\x1b[36m',
  White: '\x1b[37m',
  Reset: '\x1b[0m',
}

export const START_SYMBOL = colorize('Green', 'redis> ')

export const UP_KEY = '\x1b[A'

export const DOWN_KEY = '\x1b[B'

export const RIGHT_KEY = '\x1b[C'

export const LEFT_KEY = '\x1b[D'

export const BACKSPACE_KEY = '\x7f'

export const ENTER_KEY = '\r'

export const BACK_LINE = '\b \b'

export const RESET_LINE = '\x1b[2K\x1b[1G'

export const REDIS_COMMANDS = [
  'info',
  'hello',
  'set',
  'get',
  'del',
  'keys',
  'incr',
  'decr',
  'hset',
  'hget',
  'lpush',
  'lrange',
  'monitor',
]
