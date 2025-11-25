import { REDIS_COMMANDS, TermColors } from './constants'

export const colorize = (color: keyof typeof TermColors, text: string) => {
  return `${TermColors[color]}${text}${TermColors.Reset}`
}

export const isRedisCommand = (command: string) => {
  return (
    REDIS_COMMANDS.includes(command) ||
    REDIS_COMMANDS.map((c) => c.toUpperCase()).includes(command)
  )
}
