import {
  catppuccinThemes,
  defaultDarkTheme as defaultCatppuccinDarkTheme,
  defaultLightTheme as defaultCatppuccinLightTheme,
} from './catppuccin'
import { githubThemes } from './github'
import { monokaiThemes } from './monokai'
import { vscodeThemes } from './vscode'

export { catppuccinThemes } from './catppuccin'
export { githubThemes } from './github'
export { monokaiThemes } from './monokai'
export { vscodeThemes } from './vscode'

export const allThemes = [
  ...catppuccinThemes,
  ...githubThemes,
  ...monokaiThemes,
  ...vscodeThemes,
]

export const defaultLightTheme =
  allThemes.find((theme) => theme.id === defaultCatppuccinLightTheme.id) ??
  allThemes.find((theme) => !theme.dark) ??
  allThemes[0]

export const defaultDarkTheme =
  allThemes.find((theme) => theme.id === defaultCatppuccinDarkTheme.id) ??
  allThemes.find((theme) => theme.dark) ??
  allThemes[0]

export type { Theme } from './type'
