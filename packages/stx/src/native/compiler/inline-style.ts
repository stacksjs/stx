import type { STXStyle } from './ir'
import { createStyleVariables, type NativeStyleVariables } from './style-variables'

export interface NativeStyleContext {
  inheritedVariables?: NativeStyleVariables
  onVariables?: (variables: NativeStyleVariables) => void
}

/** Every property `STXStyle` declares, for inline `style=""` translation. */
const STYLE_KEYS = new Set([
  'display', 'gridColumns', 'gridTemplateColumns', 'gridTemplateRows', 'gridAutoRows',
  'flex', 'flexGrow', 'flexShrink', 'flexBasis', 'flexDirection', 'flexWrap',
  'justifyContent', 'alignItems', 'alignSelf', 'alignContent', 'position', 'top', 'right',
  'bottom', 'left', 'zIndex', 'width', 'height', 'minWidth', 'maxWidth', 'minHeight',
  'maxHeight', 'aspectRatio', 'margin', 'marginTop', 'marginRight', 'marginBottom',
  'marginLeft', 'marginHorizontal', 'marginVertical', 'padding', 'paddingTop',
  'paddingRight', 'paddingBottom', 'paddingLeft', 'paddingHorizontal', 'paddingVertical',
  'gap', 'rowGap', 'columnGap', 'borderWidth', 'borderTopWidth', 'borderRightWidth',
  'borderBottomWidth', 'borderLeftWidth', 'borderColor', 'borderTopColor',
  'borderRightColor', 'borderBottomColor', 'borderLeftColor', 'borderRadius',
  'borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomLeftRadius',
  'borderBottomRightRadius', 'borderStyle', 'backgroundColor', 'backgroundImage',
  'opacity', 'shadowColor', 'shadowOffset', 'shadowOpacity', 'shadowRadius', 'elevation',
  'color', 'fontSize', 'fontWeight', 'fontStyle', 'fontFamily', 'lineHeight',
  'letterSpacing', 'textAlign', 'textDecorationLine', 'textDecorationColor',
  'textTransform', 'resizeMode', 'tintColor', 'transform', 'overflow',
  'fill', 'stroke', 'strokeWidth',
  'gradientDirection', 'gradientFrom', 'gradientVia', 'gradientTo',
])

/**
 * Style properties the IR declares as a bare number.
 *
 * Emitting a string into one of these is not a dropped property, it is a
 * dropped screen: iOS reads them as `CGFloat?`, and Swift's synthesised
 * decoder fails the WHOLE document on a type mismatch. Verified against the
 * renderer's own structs -- `{"style":{"bottom":"max(env(...), 12px)"}}`
 * returns typeMismatch and nothing renders. `null` is harmless by comparison.
 */
const NUMERIC_STYLE_KEYS = new Set([
  'gridColumns', 'gridAutoRows', 'flex', 'flexGrow', 'flexShrink', 'zIndex', 'aspectRatio',
  'gap', 'rowGap', 'columnGap',
  'borderWidth', 'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
  'borderRadius', 'borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomLeftRadius',
  'borderBottomRightRadius', 'opacity', 'shadowOpacity', 'shadowRadius', 'elevation',
  'fontSize', 'lineHeight', 'letterSpacing', 'strokeWidth',
])

/**
 * Properties the IR declares as `number | string`, where the string form is a
 * percentage and nothing else. A CSS function like `max(env(...), 12px)` is
 * not a dimension any renderer can read, so it is reported and dropped.
 */
const DIMENSION_STYLE_KEYS = new Set([
  'top', 'right', 'bottom', 'left', 'width', 'height', 'minWidth', 'maxWidth',
  'minHeight', 'maxHeight', 'flexBasis',
  'margin', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
  'marginHorizontal', 'marginVertical',
  'padding', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
  'paddingHorizontal', 'paddingVertical',
])

export interface NativeStyleDiagnostic {
  kind: 'unknown-style' | 'non-numeric-style'
  name: string
}

const NUMBER = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i
const LENGTH = /^([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)(px|rem|em)?$/i
const ANGLE_TRANSFORMS = new Set(['rotate', 'rotateX', 'rotateY', 'rotateZ', 'skewX', 'skewY'])
const NUMBER_TRANSFORMS = new Set(['perspective', 'scale', 'scaleX', 'scaleY', 'translateX', 'translateY'])

function numericValue(value: unknown): unknown {
  if (typeof value !== 'string') return value
  const match = LENGTH.exec(value)
  return match ? Number(match[1]) * (/^r?em$/i.test(match[2] || '') ? 16 : 1) : value
}

function finite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function structuredStyle(property: string, value: unknown): unknown {
  if (property === 'shadowOffset' && value && typeof value === 'object' && !Array.isArray(value)) {
    const { width, height } = value as Record<string, unknown>
    return finite(width) && finite(height) ? { width, height } : undefined
  }
  if (property === 'transform' && Array.isArray(value)) {
    const steps: Record<string, unknown>[] = []
    for (const step of value) {
      if (!step || typeof step !== 'object' || Array.isArray(step) || Object.keys(step).length !== 1)
        return undefined
      const [key, raw] = Object.entries(step)[0]
      if (NUMBER_TRANSFORMS.has(key) && finite(raw))
        steps.push({ [key]: raw })
      else if (ANGLE_TRANSFORMS.has(key) && typeof raw === 'string' && /^[+-]?(?:\d+\.?\d*|\.\d+)(?:deg|rad)$/.test(raw))
        steps.push({ [key]: raw })
      else return undefined
    }
    return steps
  }
  return undefined
}

/** Split declarations without cutting quoted strings or function arguments. */
function declarations(css: string): Array<[string, string]> {
  const result: Array<[string, string]> = []
  let start = 0
  let depth = 0
  let quote = ''
  for (let i = 0; i <= css.length; i++) {
    const char = css[i]
    if (char === '\\') { i++; continue }
    if (quote) {
      if (char === quote) quote = ''
      continue
    }
    if (char === '"' || char === "'") { quote = char; continue }
    if (char === '(') depth++
    if (char === ')') depth = Math.max(0, depth - 1)
    if (i !== css.length && (char !== ';' || depth)) continue
    const declaration = css.slice(start, i)
    const colon = declaration.indexOf(':')
    if (colon !== -1)
      result.push([declaration.slice(0, colon).trim(), declaration.slice(colon + 1).trim()])
    start = i + 1
  }
  return result
}

/**
 * The same style boundary for compiled HTML and reactive native bindings.
 * Pure JS: callers decode HTML entities only at the HTML boundary.
 * Unsupported values are reported and omitted, never sent to numeric host fields.
 */
function styleEntries(input: unknown, report: (diagnostic: NativeStyleDiagnostic) => void): Array<[string, unknown]> {
  let entries: Array<[string, unknown]>
  if (typeof input === 'string') {
    input = input.trim()
    if (!input) return []
    try { input = JSON.parse(input as string) }
    catch { /* CSS text, not a serialized style object. */ }
  }
  if (typeof input === 'string') entries = declarations(input)
  else if (input && typeof input === 'object' && !Array.isArray(input)) entries = Object.entries(input)
  else {
    if (input != null && input !== false) report({ kind: 'non-numeric-style', name: 'style' })
    return []
  }
  return entries
}

export function parseNativeStyle(input: unknown, report: (diagnostic: NativeStyleDiagnostic) => void = () => {}, context: NativeStyleContext = {}): STXStyle {
  const entries = styleEntries(input, report)
  const variables = createStyleVariables(entries, context.inheritedVariables)
  context.onVariables?.(variables.computed())
  return parseEntries(entries, variables, report)
}

/** Resolve all same-element variable declarations before evaluating any style layer. */
export function parseNativeStyleLayers(inputs: unknown[], inheritedVariables: NativeStyleVariables | undefined, report: (diagnostic: NativeStyleDiagnostic) => void): {
  variables: NativeStyleVariables
  styles: STXStyle[]
} {
  const layers = inputs.map(input => styleEntries(input, report))
  const variables = createStyleVariables(layers.flat(), inheritedVariables)
  const computed = variables.computed()
  return { variables: computed, styles: layers.map(entries => parseEntries(entries, variables, report)) }
}

function parseEntries(entries: Array<[string, unknown]>, variables: ReturnType<typeof createStyleVariables>, report: (diagnostic: NativeStyleDiagnostic) => void): STXStyle {
  const style: Record<string, unknown> = {}
  const declarationNames: string[] = []
  for (const [rawProperty, raw] of entries) {
    if (rawProperty.trim().startsWith('--')) { declarationNames.push(rawProperty.trim()); continue }
    const property = STYLE_KEYS.has(rawProperty) || rawProperty.trim().startsWith('--')
      ? rawProperty
      : rawProperty.trim().toLowerCase().replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase())
    if (!STYLE_KEYS.has(property)) {
      report({ kind: 'unknown-style', name: property })
      continue
    }
    if (raw == null || raw === '') continue
    const value = typeof raw === 'string' ? variables.resolve(raw.trim()) : raw
    if (value === undefined) { report({ kind: 'non-numeric-style', name: property }); continue }
    if (value === '') continue
    let translated: unknown
    if (NUMERIC_STYLE_KEYS.has(property) || DIMENSION_STYLE_KEYS.has(property)) {
      translated = numericValue(value)
      if (!finite(translated) && !(DIMENSION_STYLE_KEYS.has(property) && typeof translated === 'string' && translated.endsWith('%') && NUMBER.test(translated.slice(0, -1)) && Number.isFinite(Number(translated.slice(0, -1)))))
        translated = undefined
    }
    else if (property === 'shadowOffset' || property === 'transform') translated = structuredStyle(property, value)
    else if (property === 'gridTemplateColumns' || property === 'gridTemplateRows') translated = finite(value) || typeof value === 'string' ? value : undefined
    // Font weights are strings in the IR, even when authored as object numbers.
    else if (property === 'fontWeight' && finite(value)) translated = String(value)
    else if (typeof value === 'string') translated = value

    if (translated === undefined) report({ kind: 'non-numeric-style', name: property })
    else style[property] = translated
  }
  // An unconsumed declaration may be an attempted inherited theme override.
  // Keep it visible until native ancestor/stylesheet variable transport exists.
  for (const name of declarationNames)
    if (!variables.used.has(name)) report({ kind: 'unknown-style', name })
  return style as STXStyle
}
