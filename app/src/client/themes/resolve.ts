import type { EditorTokenPalette, Theme } from './type'
import {
  blendHex,
  hexToRgb,
  isOpaqueHex,
  nudgeBg,
  parseHex,
  rgb,
  toAlphaColor,
} from '@client/utils/color'

type ScopeMap = Map<string, string>

interface TokenColorEntry {
  scope?: string | string[]
  settings?: { foreground?: string; fontStyle?: string }
}

function buildScopeMap(tokenColors: TokenColorEntry[]): ScopeMap {
  const map: ScopeMap = new Map()
  for (const entry of tokenColors) {
    if (!entry.scope || !entry.settings?.foreground) continue
    const scopes =
      typeof entry.scope === 'string' ? entry.scope.split(/,\s*/) : entry.scope
    for (const s of scopes) {
      const key = s.trim()
      if (!map.has(key)) map.set(key, entry.settings.foreground)
    }
  }
  return map
}

function findColor(scopeMap: ScopeMap, ...candidates: string[]): string | null {
  for (const c of candidates) {
    const v = scopeMap.get(c)
    if (v) return v
  }
  return null
}

interface RawColors {
  [key: string]: string | undefined
}

function extractEditorHex(
  scopeMap: ScopeMap,
  colors: RawColors,
  isDark: boolean
) {
  const fg = colors['editor.foreground'] ?? (isDark ? '#d4d4d4' : '#333333')

  const propertyName =
    findColor(
      scopeMap,
      'support.type.property-name.json',
      'support.type.property-name',
      'variable.other.property',
      'meta.object-literal.key',
      'entity.name.tag',
      'variable.other.readwrite'
    ) ?? fg

  const string =
    findColor(scopeMap, 'string', 'string.quoted', 'string.quoted.double') ??
    (isDark ? '#a6e3a1' : '#22863a')

  const number =
    findColor(
      scopeMap,
      'constant.numeric',
      'constant.language.numeric',
      'constant.other.color'
    ) ??
    findColor(scopeMap, 'constant') ??
    (isDark ? '#fab387' : '#005cc5')

  const literal =
    findColor(
      scopeMap,
      'constant.language.boolean',
      'constant.language.false',
      'constant.language.true',
      'constant.language.null',
      'constant.language'
    ) ?? number

  const keyword =
    findColor(scopeMap, 'keyword', 'keyword.control', 'keyword.operator') ??
    (isDark ? '#cba6f7' : '#d73a49')

  const escape =
    findColor(scopeMap, 'constant.character.escape', 'constant.character') ??
    keyword

  const punctuation =
    findColor(
      scopeMap,
      'punctuation',
      'punctuation.definition',
      'punctuation.separator'
    ) ?? null

  const bracket = colors['editorBracketHighlight.foreground1'] ?? keyword

  const invalid =
    findColor(scopeMap, 'invalid', 'invalid.illegal') ??
    colors['errorForeground'] ??
    (isDark ? '#f38ba8' : '#cb2431')

  return {
    propertyName,
    string,
    number,
    literal,
    keyword,
    escape,
    punctuation,
    bracket,
    invalid,
  }
}

function pickBorder(colors: RawColors, bgHex: string, isDark: boolean): string {
  const candidates = [
    colors['editorGroup.border'],
    colors['panel.border'],
    colors['editorWidget.border'],
    colors['sideBarSectionHeader.border'],
    colors['contrastBorder'],
  ]
  for (const c of candidates) {
    if (c && isOpaqueHex(c)) return hexToRgb(c)
    if (c) return blendHex(c, bgHex)
  }
  const fgHex = colors['editor.foreground'] ?? (isDark ? '#d4d4d4' : '#333333')
  const [fr, fg, fb] = parseHex(fgHex)
  const [br, bg2, bb] = parseHex(bgHex)
  const a = isDark ? 0.12 : 0.15
  return `${Math.round(fr * a + br * (1 - a))} ${Math.round(fg * a + bg2 * (1 - a))} ${Math.round(fb * a + bb * (1 - a))}`
}

function pickMuted(colors: RawColors, bgHex: string, isDark: boolean): string {
  const sidebar = colors['sideBar.background']
  if (
    sidebar &&
    isOpaqueHex(sidebar) &&
    sidebar.toLowerCase() !== bgHex.toLowerCase()
  ) {
    return hexToRgb(sidebar)
  }

  const lineHL = colors['editor.lineHighlightBackground']
  if (lineHL) {
    return blendHex(lineHL, bgHex)
  }

  const hover = colors['list.hoverBackground']
  if (hover) {
    return blendHex(hover, bgHex)
  }

  return nudgeBg(bgHex, isDark)
}

export interface RawTextMateTheme {
  name?: string
  displayName?: string
  type?: 'dark' | 'light'
  colors?: RawColors
  tokenColors?: TokenColorEntry[]
}

export function resolveThemeFromTm(
  id: string,
  displayName: string,
  isDark: boolean,
  raw: RawTextMateTheme
): Theme {
  const colors = raw.colors ?? {}
  const tokenColors = raw.tokenColors ?? []
  const scopeMap = buildScopeMap(tokenColors)
  const hex = extractEditorHex(scopeMap, colors, isDark)

  const bg = colors['editor.background'] ?? (isDark ? '#1e1e2e' : '#ffffff')
  const fg = colors['editor.foreground'] ?? (isDark ? '#d4d4d4' : '#333333')
  const primary = colors['button.background'] ?? hex.keyword
  const primaryFg =
    colors['button.foreground'] ?? (isDark ? '#000000' : '#ffffff')
  const secondary =
    colors['editorGroup.border'] ??
    colors['panel.border'] ??
    colors['sideBar.background'] ??
    (isDark ? '#2a2a3a' : '#e5e5e5')
  const borderRgb = pickBorder(colors, bg, isDark)
  const mutedRgb = pickMuted(colors, bg, isDark)
  const accent =
    colors['input.background'] ??
    colors['activityBar.background'] ??
    (isDark ? '#333348' : '#d1d5db')
  const danger = colors['errorForeground'] ?? hex.invalid

  const fgRgb = rgb(fg, '51 51 51')

  const editorColors: EditorTokenPalette = {
    propertyName: rgb(hex.propertyName, fgRgb),
    string: rgb(hex.string, fgRgb),
    number: rgb(hex.number, fgRgb),
    literal: rgb(hex.literal, fgRgb),
    keyword: rgb(hex.keyword, fgRgb),
    escape: rgb(hex.escape, fgRgb),
    bracket: rgb(hex.bracket, fgRgb),
    punctuation: hex.punctuation
      ? rgb(hex.punctuation, fgRgb)
      : toAlphaColor(fgRgb, 0.72),
    invalid: rgb(hex.invalid, '220 38 38'),
  }

  return {
    id,
    name: displayName,
    dark: isDark,
    editorColors,
    tagColors: {
      string: rgb(hex.string, fgRgb),
      list: rgb(hex.keyword, fgRgb),
      set: rgb(hex.number, fgRgb),
      zset: rgb(hex.escape, fgRgb),
      hash: rgb(hex.propertyName, fgRgb),
      stream: rgb(hex.literal, fgRgb),
    },
    baseColors: {
      background: rgb(bg, '255 255 255'),
      foreground: fgRgb,
      primary: rgb(primary, fgRgb),
      primaryForeground: rgb(primaryFg, '255 255 255'),
      secondary: rgb(secondary, isDark ? '58 58 58' : '229 229 229'),
      muted: mutedRgb,
      accent: rgb(accent, isDark ? '62 68 81' : '209 213 219'),
      border: borderRgb,
      success: rgb(hex.string, '22 163 74'),
      successForeground: rgb(bg, '255 255 255'),
      warning: rgb(hex.number, '202 138 4'),
      warningForeground: rgb(bg, isDark ? '23 23 23' : '254 252 232'),
      danger: rgb(danger, '220 38 38'),
      dangerForeground: isDark ? '255 255 255' : '254 242 242',
    },
  }
}
