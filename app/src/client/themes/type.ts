export type EditorTokenPalette = {
  propertyName: string
  string: string
  number: string
  literal: string
  keyword: string
  escape: string
  bracket: string
  punctuation: string
  invalid: string
}

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
    border: string

    success: string
    successForeground: string

    warning: string
    warningForeground: string

    danger: string
    dangerForeground: string
  }
  editorColors?: EditorTokenPalette
}
