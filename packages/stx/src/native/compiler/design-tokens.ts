import { DENSITY_FONT_SIZES, DENSITY_SPACING, DENSITY_TOKENS, SHAPE_TOKENS } from '../../theme-tokens'

/** Shared CSS token defaults in native logical points (the default root is 16px). */
function tokenLength(value: string | undefined): number | undefined {
  const match = value && /^(\d+(?:\.\d+)?)(px|rem)$/.exec(value)
  if (!match) return undefined
  return Number(match[1]) * (match[2] === 'rem' ? 16 : 1)
}

export function nativeShapeRadius(name: string): number | undefined {
  return tokenLength(SHAPE_TOKENS[name]?.value)
}

export function nativeDensitySpacing(name: string): number | undefined {
  return tokenLength(DENSITY_TOKENS[DENSITY_SPACING[name]]?.value)
}

export function nativeDensityType(name: string): { fontSize: number, lineHeight: number } | undefined {
  const role = DENSITY_FONT_SIZES[name]
  if (!role) return undefined
  const fontSize = tokenLength(DENSITY_TOKENS[role.size]?.value)
  const lineHeight = tokenLength(DENSITY_TOKENS[role.leading]?.value)
  if (fontSize === undefined || lineHeight === undefined) return undefined
  return { fontSize, lineHeight }
}
