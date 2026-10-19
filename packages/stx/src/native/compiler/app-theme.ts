/**
 * The app's role tokens, for a native screen.
 *
 * A web page links the generated stylesheet, which opens with the `:root` /
 * `.dark` block giving every role token its value (`tokenCSS` in
 * ts-css-config.ts). A native screen compiles without that stylesheet, so a
 * role an app answered in its css config (`roles: { accent: ... }`) reached the
 * browser and never the phone: the same shared component drew the app's
 * colours on the web and stx's stock greys on device.
 *
 * The native translator already reads document-level variables from a
 * `<style>` in the rendered screen, in both appearances (stylesheet-theme.ts),
 * so the fix is to hand it the app's answers as one. Only the answered roles
 * are declared: the translator falls back to each role's stock shade on its
 * own, and an app without answers keeps exactly the tree it had.
 *
 * Colours resolve against the native palette rather than the web one. The web
 * palette is oklch, which neither host parses, so `emerald-600` has to arrive
 * as the hex the native compiler already uses for `bg-emerald-600`.
 *
 * @module native/compiler/app-theme
 */

import type { RoleColor } from '../../theme-tokens'
import path from 'node:path'
import { DENSITY_TOKENS, densityVariable, SEMANTIC_TOKENS, SHAPE_TOKENS, shapeVariable, tokenVariable } from '../../theme-tokens'
import { nativePaletteColor } from './headwind-to-style'

const byRoot = new Map<string, Promise<string>>()

/** A colour answer as a native host reads it: a palette shade, an app colour, or a literal. */
function nativeColor(reference: string | undefined, appColors: Record<string, any>): string | undefined {
  if (!reference) return undefined
  const value = reference.trim()
  const split = value.lastIndexOf('-')
  const family = split === -1 ? appColors[value] : appColors[value.slice(0, split)]
  const own = split === -1 ? family : family?.[value.slice(split + 1)]
  if (typeof own === 'string' && /^#[\da-f]{3,8}$/i.test(own)) return own
  return nativePaletteColor(value) ?? nativePaletteColor(`[${value}]`)
}

/** The answered roles as `:root` and `.dark` declarations, from a css config. */
export function nativeThemeCSS(config: Record<string, any>): string {
  const roles = (config.roles ?? {}) as Record<string, RoleColor>
  const shapes = (config.shapes ?? {}) as Record<string, string>
  const density = (config.density ?? {}) as Record<string, string>
  const appColors = { ...config.theme?.colors, ...config.theme?.extend?.colors }
  const light: string[] = []
  const dark: string[] = []
  for (const [name, answer] of Object.entries(roles)) {
    if (!SEMANTIC_TOKENS[name]) continue
    const lightValue = nativeColor(typeof answer === 'string' ? answer : answer?.light, appColors)
    const darkValue = nativeColor(typeof answer === 'string' ? answer : answer?.dark, appColors)
    if (lightValue) light.push(`${tokenVariable(name)}: ${lightValue};`)
    if (darkValue) dark.push(`${tokenVariable(name)}: ${darkValue};`)
  }
  for (const [name, value] of Object.entries(shapes)) {
    if (SHAPE_TOKENS[name]) light.push(`${shapeVariable(name)}: ${value};`)
  }
  for (const [name, value] of Object.entries(density)) {
    if (DENSITY_TOKENS[name]) light.push(`${densityVariable(name)}: ${value};`)
  }
  return [
    light.length ? `:root { ${light.join(' ')} }` : '',
    dark.length ? `.dark { ${dark.join(' ')} }` : '',
  ].filter(Boolean).join('\n')
}

async function load(root: string): Promise<string> {
  const { resolveUserCssConfig } = await import('../../dev-server/ts-css')
  const user = await resolveUserCssConfig(root) as Record<string, any> | null
  return user ? nativeThemeCSS(user) : ''
}

/**
 * The role block for the app at `root`, or `''` when its css config answers
 * no role. Read once per root per process.
 */
export function appThemeCSS(root: string): Promise<string> {
  const key = path.resolve(root)
  let pending = byRoot.get(key)
  if (!pending) {
    pending = load(key).catch(() => '')
    byRoot.set(key, pending)
  }
  return pending
}

/** Forget what was read, for a test or a config edit in a long-lived process. */
export function resetAppThemeCSS(): void {
  byRoot.clear()
}
