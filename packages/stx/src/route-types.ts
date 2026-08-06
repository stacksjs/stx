/**
 * Typed route paths that actually type-check (stacksjs/stx#1887).
 *
 * `generateRouteTypes()` emitted `declare module "stx/routes" { interface
 * RouteMap … }` and nothing in the source tree declared or imported
 * `stx/routes`. Because that specifier does not resolve, TypeScript treated it
 * as an ambient module declaration rather than an augmentation — so it parsed,
 * shipped, and constrained nothing. `navigate('/dashbaord')` type-checked.
 *
 * ## Why the obvious fix does not work
 *
 * The tempting shape is `type RoutePath = KnownRoute | (string & {})`. It
 * cannot catch anything: a parameter that accepts a computed `string`
 * necessarily accepts every string literal too. It buys autocomplete and zero
 * checking, which is the same trade the dangling declaration already made.
 *
 * The other tempting shape — a plain union — rejects real code. This repo's own
 * tests navigate to `'?status=resolved'`, `'guide'` and
 * `'https://example.com/pricing'`; apps build URLs with template literals and
 * ternaries. A union rejects all of it, and measured against a real app it
 * would have produced zero true positives against five false ones, because the
 * generated union holds *patterns* (`/cars/:id`) while callers pass *URLs*
 * (`/cars/42`).
 *
 * ## What this does instead
 *
 * {@link CheckHref} is a generic gate applied to the argument's own literal
 * type. Non-literals pass through untouched, so anything computed still
 * compiles; only a leading-slash string literal is checked, against the routes
 * expanded from patterns. A typo in a hand-written path is the one thing that
 * fails — which is the only thing worth failing.
 *
 * @module route-types
 */

/**
 * Routes that exist, augmented by the generated
 * `<state-dir>/route-types.d.ts`.
 *
 * Empty here on purpose: while it is empty every route type widens to `string`,
 * so a project that has not generated the declaration — or has not added the
 * state directory to its tsconfig — is unaffected.
 *
 * The value type is the route's params, so one interface serves both the
 * pattern union and per-route param lookup.
 */
export interface KnownRoutes {}

type RouteKeys = keyof KnownRoutes & string

/** Tuple-wrapped so a `never` key set does not distribute into `true`. */
type NoRoutes = [RouteKeys] extends [never] ? true : false

/** Every known route pattern, or `string` when none were generated. */
export type RoutePattern = NoRoutes extends true ? string : RouteKeys

/** The params a pattern declares. */
export type RouteParams<P extends RoutePattern> = P extends RouteKeys
  ? KnownRoutes[P]
  : Record<string, string>

/**
 * A pattern with its params replaced by wildcards, so a concrete URL matches.
 *
 * `/cars/:id` becomes `` `/cars/${string}` ``, which is what a caller actually
 * passes. Comparing against the raw pattern would reject every dynamic-route
 * navigation in existence.
 */
type PatternPrefix<P extends string> = P extends `${infer Head}:${string}` ? `${Head}${string}` : P

/** `/settings/:tab?` also matches `/settings` with the segment omitted. */
type OptionalBase<P extends string> = P extends `${infer Base}/:${string}?` ? Base : never

/** Every shape a caller may legitimately pass for a known route. */
export type RouteHref = PatternPrefix<RoutePattern> | OptionalBase<RoutePattern>

type StripHash<S extends string> = S extends `${infer Base}#${string}` ? Base : S
type StripQuery<S extends string> = S extends `${infer Base}?${string}` ? Base : S

/**
 * Error carriers. TypeScript reports the property names, so the message says
 * what is wrong rather than naming an internal type.
 */
export interface UnknownRoute<T extends string> {
  'stx: no page matches this path': T
  'known routes': RoutePattern
}

export interface RoutePatternUsedAsHref<T extends string> {
  'stx: that is a route pattern, not a URL — use $path() to fill its params': T
}

/**
 * Gate a route argument on its own literal type.
 *
 * Each step is load-bearing:
 *
 * 1. Not a string literal (a variable, a template literal, a concatenation) —
 *    pass. This is what keeps computed URLs compiling.
 * 2. No routes generated — pass, so an un-adopted project is unaffected.
 * 3. Only absolute paths are checked. A relative href, a bare `?query`, a
 *    `#hash` and `https://…` all fall through, because the router genuinely
 *    accepts them.
 * 4. A raw pattern is a mistake worth naming separately: `/cars/:id` is not a
 *    URL.
 * 5. Otherwise the path, minus any query or hash, must match a known route.
 */
export type CheckHref<T extends string>
  = string extends T
    ? T
    : string extends RoutePattern
      ? T
      : T extends `/${string}`
        ? T extends `${string}/:${string}`
          ? RoutePatternUsedAsHref<T>
          : StripQuery<StripHash<T>> extends RouteHref ? T : UnknownRoute<T>
        : T

/**
 * A route in an assignment position (a config field, an interface property),
 * where no generic parameter exists to gate on.
 *
 * Autocomplete only — it cannot reject a typo, for the reason given at the top
 * of this file. Prefer a `CheckHref`-gated function parameter where one is
 * available.
 */
export type RoutePath = RoutePattern | (string & {})

type RouteParamsInput<P extends RoutePattern> = {
  [K in keyof RouteParams<P>]: string | number | readonly string[]
}

/** Params are required only when the pattern has non-optional ones. */
type ParamsArg<P extends RoutePattern> = [keyof RouteParams<P>] extends [never]
  ? []
  : Record<never, never> extends RouteParams<P>
    ? [params?: RouteParamsInput<P>]
    : [params: RouteParamsInput<P>]

/**
 * Build a concrete URL from a route pattern.
 *
 * The strict half of the pair: `navigate()` stays permissive so computed URLs
 * keep working, and `$path()` is where a dynamic route gets checked —
 * `navigate($path('/cars/:id', { id: car.id }))`.
 *
 * Consumes the `?`/`*` sigil, drops the preceding slash when an optional
 * segment is absent, encodes catch-all segments individually so their slashes
 * survive, and appends anything left over as a query string.
 */
export function $path<P extends RoutePattern>(pattern: P, ...args: ParamsArg<P>): string {
  const params = (args[0] ?? {}) as Record<string, string | number | readonly string[]>
  const used = new Set<string>()

  const filled = String(pattern).replace(
    /(\/)?:([^/?*]+)([?*])?/g,
    (whole, slash: string | undefined, name: string, sigil: string | undefined) => {
      const value = params[name]
      used.add(name)

      if (value === undefined || value === null || value === '') {
        // An absent optional segment takes its leading slash with it, so
        // `/settings/:tab?` collapses to `/settings`, not `/settings/`.
        if (sigil === '?')
          return ''
        return whole
      }

      const encoded = Array.isArray(value)
        ? value.map(part => encodeURIComponent(String(part))).join('/')
        // A catch-all matches across slashes, so its separators must survive.
        : sigil === '*'
          ? String(value).split('/').map(part => encodeURIComponent(part)).join('/')
          : encodeURIComponent(String(value))

      return `${slash ?? ''}${encoded}`
    },
  )

  const extra = Object.keys(params).filter(key => !used.has(key))
  if (extra.length === 0)
    return filled

  const query = new URLSearchParams()
  for (const key of extra) {
    const value = params[key]
    if (Array.isArray(value))
      value.forEach(part => query.append(key, String(part)))
    else if (value !== undefined && value !== null)
      query.set(key, String(value))
  }
  return `${filled}?${query.toString()}`
}
