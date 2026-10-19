import { densityVariable, DENSITY_FONT_SIZES, DENSITY_SPACING, DENSITY_TOKENS, shapeVariable, SHAPE_TOKENS } from '../../theme-tokens'
import type { NativeStyleVariables } from './style-variables'

/** Shared CSS token defaults in native logical points (the default root is 16px). */
function tokenLength(value: string | undefined): number | undefined {
  const match = value && /^(\d+(?:\.\d+)?|\.\d+)(px|rem)?$/.exec(value.trim())
  if (!match) return undefined
  const result = Number(match[1]) * (match[2] === 'rem' ? 16 : 1)
  return Number.isFinite(result) ? result : undefined
}

export function nativeShapeRadius(name: string, variables?: NativeStyleVariables): number | undefined {
  if (!SHAPE_TOKENS[name]) return undefined
  return tokenLength(variables?.get(shapeVariable(name)) ?? SHAPE_TOKENS[name].value)
}

export function nativeDensitySpacing(name: string, variables?: NativeStyleVariables): number | undefined {
  const token = DENSITY_SPACING[name]
  if (!token) return undefined
  return tokenLength(variables?.get(densityVariable(token)) ?? DENSITY_TOKENS[token]?.value)
}

export function nativeDensityType(name: string, variables?: NativeStyleVariables): { fontSize: number, lineHeight: number } | undefined {
  const role = DENSITY_FONT_SIZES[name]
  if (!role) return undefined
  const fontSize = tokenLength(variables?.get(densityVariable(role.size)) ?? DENSITY_TOKENS[role.size]?.value)
  const lineHeight = tokenLength(variables?.get(densityVariable(role.leading)) ?? DENSITY_TOKENS[role.leading]?.value)
  if (fontSize === undefined || lineHeight === undefined) return undefined
  return { fontSize, lineHeight }
}
