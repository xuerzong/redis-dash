import { resolveThemeFromTm } from './resolve'
import type { RawTextMateTheme } from './resolve'
import { rawThemes } from './raw'

export const allThemes = rawThemes.map(({ id, displayName, dark, data }) =>
  resolveThemeFromTm(id, displayName, dark, data as unknown as RawTextMateTheme)
)

export const defaultLightTheme =
  allThemes.find((theme) => theme.id === 'catppuccin-latte') ??
  allThemes.find((theme) => !theme.dark) ??
  allThemes[0]

export const defaultDarkTheme =
  allThemes.find((theme) => theme.id === 'catppuccin-mocha') ??
  allThemes.find((theme) => theme.dark) ??
  allThemes[0]

export type { EditorTokenPalette, Theme } from './type'
