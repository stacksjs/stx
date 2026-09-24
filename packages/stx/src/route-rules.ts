/** Shared build/serve route policies. The most specific matching rule wins. */
export interface RouteCacheRule {
  /** Explicit promise that anonymous responses contain no personalized data. */
  public: true
  /** Fresh lifetime in seconds. */
  maxAge: number
  /** Additional stale-while-revalidate window in seconds (default: 0). */
  swr?: number
}

export interface RouteRule {
  rendering?: 'prerender' | 'dynamic'
  cache?: false | RouteCacheRule
}

export type RouteRules = Record<string, RouteRule>

function segments(pattern: string): string[] {
  if (!pattern.startsWith('/') || /[?#\\]/.test(pattern))
    throw new Error(`Invalid route rule pattern: ${pattern}`)
  const parts = pattern === '/' ? [] : pattern.slice(1).split('/')
  if (parts.some((part, i) => !part || (part.includes('*') && part !== '*' && part !== '**') || (part === '**' && i !== parts.length - 1) || (part.startsWith(':') && !/^:[\w]+$/.test(part))))
    throw new Error(`Unsupported route rule pattern: ${pattern}`)
  return parts
}

export function validateRouteRules(rules: RouteRules): void {
  for (const [pattern, rule] of Object.entries(rules)) {
    segments(pattern)
    if (!rule || typeof rule !== 'object' || Object.keys(rule).some(key => key !== 'rendering' && key !== 'cache'))
      throw new Error(`Unsupported route rule for ${pattern}`)
    if (rule.rendering !== undefined && rule.rendering !== 'prerender' && rule.rendering !== 'dynamic')
      throw new Error(`Unsupported rendering mode for ${pattern}`)
    if (rule.cache !== undefined && rule.cache !== false) {
      const cache = rule.cache
      if (!cache || cache.public !== true || Object.keys(cache).some(key => !['public', 'maxAge', 'swr'].includes(key)) || !Number.isFinite(cache.maxAge) || cache.maxAge <= 0 || (cache.swr !== undefined && (!Number.isFinite(cache.swr) || cache.swr < 0)))
        throw new Error(`Route cache for ${pattern} requires public: true, maxAge > 0 and swr >= 0`)
      if (rule.rendering === 'prerender')
        throw new Error(`Prerendered route ${pattern} cannot revalidate; use dynamic rendering with cache`)
    }
  }
}

/** Compile once. Literal > parameter > * > **, compared left to right. */
export function createRouteRuleResolver(rules: RouteRules = {}): (pathname: string) => RouteRule {
  validateRouteRules(rules)
  const score = (part: string): number => part === '**' ? 0 : part === '*' ? 1 : part.startsWith(':') ? 2 : 3
  const entries = Object.entries(rules).map(([pattern, rule]) => ({ pattern, parts: segments(pattern), rule }))
  entries.sort((a, b) => {
    for (let i = 0; i < Math.max(a.parts.length, b.parts.length); i++) {
      const diff = (b.parts[i] === undefined ? 4 : score(b.parts[i])) - (a.parts[i] === undefined ? 4 : score(a.parts[i]))
      if (diff) return diff
    }
    return a.pattern.localeCompare(b.pattern)
  })
  return (pathname) => {
    const input = pathname === '/' ? [] : pathname.replace(/\/$/, '').slice(1).split('/')
    return entries.find(({ parts }) => parts.every((part, i) => part === '**' || (input[i] !== undefined && (part === '*' || part.startsWith(':') || part === input[i]))) && (parts.at(-1) === '**' || parts.length === input.length))?.rule ?? {}
  }
}
