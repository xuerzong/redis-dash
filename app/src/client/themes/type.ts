export type Theme = {
  id: string
  name: string
  dark: boolean
  tagColors: {
    string: string
    list: string
    set: string
    zset: string
    hash: string
    stream: string
  }
  baseColors: {
    background: string
    foreground: string

    primary: string
    primaryForeground: string

    secondary: string
    muted: string
    accent: string

    success: string
    successForeground: string

    warning: string
    warningForeground: string

    danger: string
    dangerForeground: string
  }
}
