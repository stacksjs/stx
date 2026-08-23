/**
 * The HTTP status and headers a page decides for its own response.
 *
 * Three shapes reach the same place, so a host reads one key and gets all
 * three:
 *
 *  - `definePageMeta({ status })` — read statically out of the source, before
 *    anything runs. Right for a page that is *always* an error page.
 *  - `@status(expr)` — a template directive, evaluated where the rest of the
 *    template is. It sits inside the branch it belongs to, so a page says
 *    `@if (!feature) @status(404) @endif` next to the markup that explains it.
 *  - `setResponseStatus(code)` / `notFound()` / `setResponseHeader(n, v)` —
 *    callable from `<script server>`, for a decision that needs the lookup's
 *    result.
 *
 * The last two record on the render context under `__stxResponseStatus` and
 * `__stxResponseHeaders`. Every host that renders a view — the dev/production
 * serve in `bun-plugin`, `stx`'s own `serve`, the app dev server, the
 * precompiled production server — reads them back with `readResponseStatus`
 * and answers with what it finds.
 *
 * That read-back is the whole point. Recording without it is the failure this
 * module exists to prevent: a page that says 404 renders its not-found body
 * under a 200, which tells a crawler, a cache and an uptime check that the URL
 * is a real page.
 *
 * @module page-response
 */

import { safeEvaluate } from './safe-evaluator'

const MIN_HTTP_STATUS = 100
const MAX_HTTP_STATUS = 599

/** Context key holding the status a render asked for. */
export const RESPONSE_STATUS_KEY = '__stxResponseStatus'

/** Context key holding the headers a render asked for. */
export const RESPONSE_HEADERS_KEY = '__stxResponseHeaders'

/**
 * Is this a status a response can actually carry?
 *
 * Out of range is ignored rather than thrown everywhere below. A status is not
 * worth failing an already-rendered page over, and the range check is what
 * stops a typo becoming a 500 from whichever host reads it back.
 */
export function isHttpStatus(value: unknown): value is number {
  return typeof value === 'number'
    && Number.isInteger(value)
    && value >= MIN_HTTP_STATUS
    && value <= MAX_HTTP_STATUS
}

/**
 * Read the static HTTP status declared by `definePageMeta`.
 *
 * The development server needs this before client scripts execute so error
 * pages and other non-200 documents carry the correct response semantics.
 */
export function extractPageResponseStatus(source: string): number | undefined {
  for (const call of source.matchAll(/\bdefinePageMeta\s*\(\s*\{([\s\S]*?)\}\s*\)/g)) {
    const match = call[1].match(/(?:^|,)\s*status\s*:\s*(\d{3})(?=\s*(?:,|$))/)
    if (!match)
      continue

    const status = Number(match[1])
    if (isHttpStatus(status))
      return status
  }

  return undefined
}

/**
 * Record a status on the render context, if it is one.
 *
 * Last call wins, so a page can look, decide, then change its mind — the
 * lookup that finds the record after all must be able to take the 404 back.
 * Returns whether the status was accepted, so a caller can warn about one that
 * was not.
 */
export function recordResponseStatus(context: Record<string, any> | undefined, status: unknown): boolean {
  if (!context || typeof context !== 'object')
    return false

  const code = typeof status === 'string' && /^\d+$/.test(status.trim()) ? Number(status.trim()) : status
  if (!isHttpStatus(code))
    return false

  context[RESPONSE_STATUS_KEY] = code
  return true
}

/**
 * Record a response header on the render context.
 *
 * The pair is not optional: a page that works out mid-render that a handle has
 * moved can say 301 and, without this, cannot say where to — so the response
 * it produces is a redirect with no destination, which is worse than the 404
 * it replaced.
 */
export function recordResponseHeader(context: Record<string, any> | undefined, name: unknown, value: unknown): void {
  if (!context || typeof context !== 'object')
    return

  const header = String(name ?? '').trim()
  if (!header)
    return

  context[RESPONSE_HEADERS_KEY] = { ...(context[RESPONSE_HEADERS_KEY] as Record<string, string> | undefined), [header]: String(value) }
}

/** The status a finished render asked for, or `undefined` if it asked for none. */
export function readResponseStatus(context: Record<string, any> | undefined | null): number | undefined {
  const status = context?.[RESPONSE_STATUS_KEY]
  return isHttpStatus(status) ? status : undefined
}

/** The headers a finished render asked for, or `undefined` if it asked for none. */
export function readResponseHeaders(context: Record<string, any> | undefined | null): Record<string, string> | undefined {
  const headers = context?.[RESPONSE_HEADERS_KEY]
  if (!headers || typeof headers !== 'object')
    return undefined

  const entries = Object.entries(headers as Record<string, unknown>).map(([k, v]) => [k, String(v)] as const)
  return entries.length > 0 ? Object.fromEntries(entries) : undefined
}

/**
 * Move a recorded status/headers from one context object onto another.
 *
 * Renderers build a fresh internal context from the caller's — so a page that
 * records a status records it on an object nobody outside can read. This is
 * how the intent gets back out: call it with the internal context and the
 * caller's, after the render.
 *
 * Only copies what is there. A render that asked for nothing leaves the target
 * untouched rather than stamping it with a 200, so a caller can tell "the page
 * said 200" from "the page said nothing" — the second is what lets an outer
 * status (an error page's `definePageMeta`) survive.
 */
export function syncRecordedResponse(
  from: Record<string, any> | undefined | null,
  to: Record<string, any> | undefined | null,
): void {
  if (!from || !to || from === to || typeof to !== 'object')
    return

  const status = readResponseStatus(from)
  if (status !== undefined)
    to[RESPONSE_STATUS_KEY] = status

  const headers = readResponseHeaders(from)
  if (headers)
    to[RESPONSE_HEADERS_KEY] = { ...(to[RESPONSE_HEADERS_KEY] as Record<string, string> | undefined), ...headers }
}

/**
 * The `<script server>` bindings for deciding a response, bound to one context.
 *
 * Handed to every server script by `extractVariables`, so no host can render a
 * view and leave them out. A host that wants the calls to go somewhere of its
 * own — the dev serve puts them straight on its per-request context — overrides
 * them through the render context, which is appended after these and wins.
 */
export function responseBindings(context: Record<string, any>): {
  setResponseStatus: (status: number) => void
  setResponseHeader: (name: string, value: string) => void
  notFound: (status?: number) => void
} {
  return {
    setResponseStatus: (status: number) => {
      recordResponseStatus(context, status)
    },
    /**
     * Answer 404 for this render.
     *
     * `setResponseStatus(404)` already does this, but the status a dynamic page
     * most often needs to set is the one for "the record in the URL does not
     * exist", and spelling it out as a number every time is how pages end up
     * not doing it at all.
     *
     * Takes an optional status so the neighbouring cases read the same way:
     * `notFound(410)` for a record deliberately removed rather than missing.
     * Client-error-and-up only — `notFound(200)` is not a thing anyone means.
     */
    notFound: (status: number = 404) => {
      const code = isHttpStatus(status) && status >= 400 ? status : 404
      recordResponseStatus(context, code)
    },
    setResponseHeader: (name: string, value: string) => {
      recordResponseHeader(context, name, value)
    },
  }
}

/**
 * `@status(expr)` — the template-side spelling.
 *
 * Runs after `processConditionals`, so a `@status` in a branch that lost is
 * already gone from the template and never fires. That ordering is the feature:
 * it lets the status live beside the markup that justifies it,
 *
 *     @if (!feature)
 *       @status(404)
 *       <h1>No feature by that name.</h1>
 *     @endif
 *
 * rather than being re-derived from a flag at the top of the server block.
 *
 * A literal is taken as written; anything else goes through `safeEvaluate`
 * against the render context. An argument that evaluates to a non-status is
 * ignored — see `isHttpStatus` — but *is* warned about, because unlike a
 * runtime call this one was typed out in the template and a silent no-op there
 * reads as the feature not existing.
 */
export function processStatusDirective(
  template: string,
  context: Record<string, any>,
  options: { filePath?: string, buildMode?: string } = {},
): string {
  if (!template.includes('@status'))
    return template

  const { filePath, buildMode } = options

  /*
   * Precompilation cannot answer this one.
   *
   * `stx build` runs the directive pipeline once, with no request — so the
   * branch a `@status` sits in was chosen by whatever a build-time evaluation
   * made of `feature`, and baking that status into the compiled page would
   * hand every request the answer the build happened to compute. Recording
   * nothing is the right call; doing it silently is not, so this says so and
   * names the spelling that does work, `<script server>`'s `notFound()`, which
   * the production server re-runs per request.
   */
  const precompiling = buildMode === 'compile'

  let result = ''
  let cursor = 0
  const pattern = /@status\s*\(/g
  let match: RegExpExecArray | null

  while ((match = pattern.exec(template)) !== null) {
    const close = closingParen(template, match.index + match[0].length - 1)
    // An unbalanced `@status(` is left exactly as written. Swallowing the rest
    // of the file looking for a `)` that is not there would turn a typo into a
    // blank page.
    if (close < 0)
      break

    const arg = template.slice(match.index + match[0].length, close).trim()
    const value = /^\d+$/.test(arg) ? Number(arg) : safeEvaluate(arg, context)
    const where = filePath ? ` in ${filePath}` : ''

    if (precompiling) {
      console.warn(
        `[stx] @status(${arg})${where} is skipped when precompiling: the build has no request, so the branch it sits in is not the one a visitor will get. Call notFound() or setResponseStatus(${arg}) from <script server> instead — that runs per request.`,
      )
    }
    else if (!recordResponseStatus(context, value)) {
      console.warn(
        `[stx] @status(${arg})${where} is not an HTTP status (100-599) — ignoring it.`,
      )
    }

    result += template.slice(cursor, match.index)
    // Eat the whitespace the directive sat on, up to and including its own
    // newline, so a `@status` on its own line does not leave a blank one.
    cursor = close + 1 + (template.slice(close + 1).match(/^[^\S\n]*\n?/)?.[0].length ?? 0)
    pattern.lastIndex = cursor
  }

  return cursor === 0 ? template : result + template.slice(cursor)
}

/**
 * Index of the `)` closing the `(` at `open`, or -1 if there is none.
 *
 * String-aware, so `@status(missing ? 404 : 200)` and an argument carrying a
 * parenthesis inside quotes both survive.
 */
function closingParen(source: string, open: number): number {
  let depth = 1
  let quote: string | null = null
  let escaped = false

  for (let i = open + 1; i < source.length; i++) {
    const char = source[i]

    if (escaped) { escaped = false; continue }
    if (quote) {
      if (char === '\\') escaped = true
      else if (char === quote) quote = null
      continue
    }
    if (char === '"' || char === '\'' || char === '`') { quote = char; continue }
    if (char === '(') depth++
    else if (char === ')' && --depth === 0) return i
  }

  return -1
}
