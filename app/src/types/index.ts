export type Lang = 'zh-CN' | 'en-US'

export type Theme =
  | 'system'
  | 'github-light'
  | 'github-dark'
  | 'catppuccin-mocha'
  | 'dracula'
  | 'dark'
  | 'light'

export type Config = {
  lang: Lang
  theme: Theme
}

export type RedisRole = 'publisher' | 'subscriber'
