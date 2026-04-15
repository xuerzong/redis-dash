export function parseHex(hex: string): [number, number, number, number] {
  hex = hex.replace(/^#/, '')
  if (hex.length === 3)
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
  if (hex.length === 8) {
    const n = parseInt(hex, 16)
    return [(n >> 24) & 0xff, (n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff]
  }
  const n = parseInt(hex, 16)
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff, 255]
}

export function hexToRgb(hex: string): string {
  const [r, g, b] = parseHex(hex)
  return `${r} ${g} ${b}`
}

export function blendHex(fgHex: string, bgHex: string): string {
  const [fr, fg, fb, fa] = parseHex(fgHex)
  if (fa === 255) return `${fr} ${fg} ${fb}`
  const a = fa / 255
  const [br, bg2, bb] = parseHex(bgHex)
  return `${Math.round(fr * a + br * (1 - a))} ${Math.round(fg * a + bg2 * (1 - a))} ${Math.round(fb * a + bb * (1 - a))}`
}

export function nudgeBg(bgHex: string, isDark: boolean): string {
  const [r, g, b] = parseHex(bgHex)
  const shift = isDark ? 12 : -10
  const clamp = (v: number) => Math.max(0, Math.min(255, v + shift))
  return `${clamp(r)} ${clamp(g)} ${clamp(b)}`
}

export function rgb(hex: string | null | undefined, fallback: string): string {
  return hex ? hexToRgb(hex) : fallback
}

export function toAlphaColor(rgbStr: string, alpha: number): string {
  return `rgb(${rgbStr} / ${alpha})`
}

export function toRgbColor(rgb?: string): string | undefined {
  if (!rgb) return undefined
  return `rgb(${rgb})`
}

export function toAlphaRgbColor(
  rgb?: string,
  alpha = 0.25
): string | undefined {
  if (!rgb) return undefined
  return `rgb(${rgb} / ${alpha})`
}

export function isOpaqueHex(hex: string): boolean {
  const h = hex.replace(/^#/, '')
  if (h.length === 8) {
    const alpha = parseInt(h.slice(6), 16)
    return alpha > 200
  }
  return h.length === 3 || h.length === 6
}
