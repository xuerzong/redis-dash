import type { Theme } from './type'

export const monokaiThemes: Theme[] = [
  {
    id: 'monokai',
    name: 'Monokai',
    dark: true,
    tagColors: {
      string: '230 219 116',
      list: '174 129 255',
      set: '102 217 239',
      zset: '253 151 31',
      hash: '166 226 46',
      stream: '249 38 114',
    },
    baseColors: {
      background: '39 40 34',
      foreground: '248 248 242',
      primary: '102 217 239',
      primaryForeground: '39 40 34',
      secondary: '73 72 62',
      muted: '62 61 50',
      accent: '117 113 94',
      success: '166 226 46',
      successForeground: '39 40 34',
      warning: '253 151 31',
      warningForeground: '39 40 34',
      danger: '249 38 114',
      dangerForeground: '248 248 242',
    },
  },
]
