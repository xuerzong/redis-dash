import { REDIS_COMMANDS, TermColors } from './constants'
import {
  mixRgb,
  rgbToHex,
  toAlphaRgbColor,
  toRgbColor,
} from '@client/utils/color'
import type { Theme } from '@client/themes'

export const colorize = (color: keyof typeof TermColors, text: string) => {
  return `${TermColors[color]}${text}${TermColors.Reset}`
}

export const getTerminalTheme = (theme: Theme) => {
  const { baseColors, editorColors, tagColors } = theme
  const brighten = (rgb: string, ratio = 0.18) => {
    return mixRgb(rgb, baseColors.foreground, ratio)
  }

  const black = mixRgb(baseColors.background, baseColors.foreground, 0.12)
  const white = mixRgb(baseColors.foreground, baseColors.background, 0.12)
  const red = baseColors.danger
  const green = baseColors.success
  const yellow = baseColors.warning
  const blue = editorColors?.keyword ?? baseColors.primary
  const magenta = editorColors?.number ?? tagColors.zset
  const cyan = editorColors?.propertyName ?? tagColors.stream

  return {
    background: toRgbColor(baseColors.background),
    foreground: toRgbColor(baseColors.foreground),
    cursor: toRgbColor(baseColors.primary),
    cursorAccent: toRgbColor(baseColors.background),
    selectionBackground: toAlphaRgbColor(baseColors.primary, 0.28),
    selectionInactiveBackground: toAlphaRgbColor(baseColors.secondary, 0.2),
    black: rgbToHex(black),
    red: rgbToHex(red),
    green: rgbToHex(green),
    yellow: rgbToHex(yellow),
    blue: rgbToHex(blue),
    magenta: rgbToHex(magenta),
    cyan: rgbToHex(cyan),
    white: rgbToHex(white),
    brightBlack: rgbToHex(brighten(black, 0.28)),
    brightRed: rgbToHex(brighten(red)),
    brightGreen: rgbToHex(brighten(green)),
    brightYellow: rgbToHex(brighten(yellow)),
    brightBlue: rgbToHex(brighten(blue)),
    brightMagenta: rgbToHex(brighten(magenta)),
    brightCyan: rgbToHex(brighten(cyan)),
    brightWhite: rgbToHex(brighten(white, 0.08)),
  }
}

export const isRedisCommand = (command: string) => {
  return (
    REDIS_COMMANDS.includes(command) ||
    REDIS_COMMANDS.map((c) => c.toUpperCase()).includes(command)
  )
}
