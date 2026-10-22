/**
 * The app's own utility vocabulary, for native styles.
 *
 * A web view and a native screen are one source: the same classes have to
 * mean the same thing on both. The web reads the app's CSS config (Crosswind
 * shortcuts like `card` and `btn-primary`, theme colours like `bg-hq-action`,
 * the breakpoints behind `md:`); native styles read the same config through
 * here. The compiler loads it from the project and the native bundle carries
 * it, so classes bound at runtime resolve the same way.
 */

/** Tailwind's (and Crosswind's) default min-widths, in points. */
export const DEFAULT_BREAKPOINTS: Readonly<Record<string, number>> = { 'sm': 640, 'md': 768, 'lg': 1024, 'xl': 1280, '2xl': 1536 }

export interface NativeStyleConfig {
  /** `card` → `bg-white rounded-xl p-5 ...`, as the app's CSS config writes them. */
  shortcuts?: Record<string, string>
  /** Theme colours, nested as the CSS config nests them (`hq: { action: ... }` → `hq-action`). */
  colors?: Record<string, unknown>
  /** Breakpoint min-widths in points, defaulting to DEFAULT_BREAKPOINTS. */
  breakpoints?: Record<string, number>
}

interface ResolvedStyleConfig {
  shortcuts: Map<string, string>
  colors: Map<string, string>
  breakpoints: Map<string, number>
}

let current: ResolvedStyleConfig = resolve({})
let globalSource: unknown
let globalResolved: ResolvedStyleConfig | null = null

/**
 * The config in force. A native bundle sets `globalThis.__stxNativeStyleConfig`
 * before its screen starts (the runtime's own module instance never saw the
 * compiler's call); the compiler calls setNativeStyleConfig.
 */
function active(): ResolvedStyleConfig {
  const source = (globalThis as { __stxNativeStyleConfig?: NativeStyleConfig }).__stxNativeStyleConfig
  if (!source) return current
  if (source !== globalSource) {
    globalSource = source
    globalResolved = resolve(source)
  }
  return globalResolved!
}

function flattenColors(colors: Record<string, unknown> | undefined, into = new Map<string, string>(), prefix = ''): Map<string, string> {
  for (const [name, value] of Object.entries(colors ?? {})) {
    const key = name === 'DEFAULT' ? prefix.replace(/-$/, '') : `${prefix}${name}`
    if (typeof value === 'string') into.set(key, value)
    else if (value && typeof value === 'object') flattenColors(value as Record<string, unknown>, into, `${key}-`)
  }
  return into
}

function breakpointsOf(config: Record<string, unknown> | undefined): Record<string, number> {
  const out: Record<string, number> = {}
  for (const [name, value] of Object.entries(config ?? {})) {
    const points = typeof value === 'number' ? value : Number.parseFloat(String(value))
    if (Number.isFinite(points)) out[name] = points
  }
  return out
}

function resolve(config: NativeStyleConfig): ResolvedStyleConfig {
  return {
    shortcuts: new Map(Object.entries(config.shortcuts ?? {}).filter(([, value]) => typeof value === 'string')),
    colors: flattenColors(config.colors),
    breakpoints: new Map(Object.entries({ ...DEFAULT_BREAKPOINTS, ...breakpointsOf(config.breakpoints as Record<string, unknown>) })),
  }
}

let currentSource: NativeStyleConfig = {}

/** Use `config` for every native class resolution from now on. */
export function setNativeStyleConfig(config: NativeStyleConfig | null | undefined): void {
  currentSource = config ?? {}
  current = resolve(currentSource)
}

/** Run `work` with `config` in force, then put back what was there (a compile's config is its own). */
export async function withNativeStyleConfig<T>(config: NativeStyleConfig, work: () => Promise<T>): Promise<T> {
  const before = currentSource
  setNativeStyleConfig(config)
  try {
    return await work()
  }
  finally {
    setNativeStyleConfig(before)
  }
}

/**
 * The part of a project's CSS config native styles read, in the shape a
 * native bundle carries (plain JSON): shortcuts, theme colours, breakpoints.
 */
export function nativeStyleConfigFrom(cssConfig: Record<string, any> | null | undefined): NativeStyleConfig {
  if (!cssConfig) return {}
  const theme = cssConfig.theme ?? {}
  const shortcuts = Object.fromEntries(Object.entries(cssConfig.shortcuts ?? {}).filter(([, value]) => typeof value === 'string')) as Record<string, string>
  return {
    ...(Object.keys(shortcuts).length ? { shortcuts } : {}),
    ...(theme.colors ? { colors: JSON.parse(JSON.stringify(theme.colors)) } : {}),
    ...(theme.screens ? { breakpoints: breakpointsOf(theme.screens) } : {}),
  }
}

/** A shortcut's classes, or undefined when `name` is not one. */
export function nativeShortcut(name: string): string | undefined {
  return active().shortcuts.get(name)
}

/** A theme colour's value (`var(--hq-action, #007aff)`), or undefined. */
export function nativeThemeColor(name: string): string | undefined {
  return active().colors.get(name)
}

/** A breakpoint's min-width in points, or undefined when `name` is not one. */
export function nativeBreakpoint(name: string): number | undefined {
  return active().breakpoints.get(name)
}
