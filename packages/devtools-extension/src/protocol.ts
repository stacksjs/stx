/**
 * DevTools extension ↔ page message protocol (stacksjs/stx#1747, Phases 4–6).
 *
 * The browser-extension panel runs in a different world from the inspected page,
 * so it can't touch `window.__stxDevtools` directly — it talks to a page-injected
 * bridge (`inject.ts`) over `postMessage`. This module is the **contract**: the
 * request/response shapes plus a PURE `handleDevtoolsRequest` that maps a request
 * to the matching `__stxDevtools` call. Keeping it pure makes the whole protocol
 * unit-testable without a browser; the bridge is just plumbing on top.
 *
 * Mirrors the in-repo introspection protocol (`window.__stxDevtools`, version 2):
 * Phase 1 `tree`/`scope`/`stores`, Phase 2 `enable`/`stats`/`graph`,
 * Phase 3 `ifTrace`/`queries`.
 */

/** The subset of `window.__stxDevtools` (version 2) the extension consumes. */
export interface StxDevtoolsApi {
  version: number
  tree: () => unknown
  scope: (id: string) => unknown
  stores: () => unknown
  enable: () => void
  disable: () => void
  tracking: () => boolean
  stats: () => unknown
  resetStats: () => void
  graph: () => unknown
  ifTrace: () => unknown
  queries: () => unknown
}

export type DevtoolsRequestType =
  | 'version' | 'tree' | 'scope' | 'stores'
  | 'enable' | 'disable' | 'tracking' | 'stats' | 'resetStats'
  | 'graph' | 'ifTrace' | 'queries'

export interface DevtoolsRequest {
  /** Correlates a response to its request. */
  id: number
  type: DevtoolsRequestType
  /** Args for parameterized requests (e.g. `{ scopeId }` for `scope`). */
  payload?: Record<string, unknown>
}

export interface DevtoolsResponse {
  id: number
  ok: boolean
  result?: unknown
  error?: string
}

/** Wire marker so the bridge can pick our messages out of the postMessage noise. */
export const STX_DEVTOOLS_CHANNEL = 'stx-devtools'

/**
 * Map a protocol request to the matching `__stxDevtools` call. Pure: never
 * throws — a missing API, an unknown type, or a call that throws all come back
 * as `{ ok: false, error }`.
 */
export function handleDevtoolsRequest(
  devtools: StxDevtoolsApi | null | undefined,
  req: DevtoolsRequest,
): DevtoolsResponse {
  if (!devtools)
    return { id: req.id, ok: false, error: 'stx devtools not found on this page (no signals runtime?)' }
  try {
    switch (req.type) {
      case 'version': return done(req, devtools.version)
      case 'tree': return done(req, devtools.tree())
      case 'scope': return done(req, devtools.scope(String((req.payload && req.payload.scopeId) || '')))
      case 'stores': return done(req, devtools.stores())
      case 'graph': return done(req, devtools.graph())
      case 'ifTrace': return done(req, devtools.ifTrace())
      case 'queries': return done(req, devtools.queries())
      case 'stats': return done(req, devtools.stats())
      case 'tracking': return done(req, devtools.tracking())
      case 'enable': devtools.enable(); return done(req, { tracking: devtools.tracking() })
      case 'disable': devtools.disable(); return done(req, { tracking: devtools.tracking() })
      case 'resetStats': devtools.resetStats(); return done(req, true)
      default: return { id: req.id, ok: false, error: `unknown request type: ${(req as DevtoolsRequest).type}` }
    }
  }
  catch (e) {
    return { id: req.id, ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

function done(req: DevtoolsRequest, result: unknown): DevtoolsResponse {
  return { id: req.id, ok: true, result }
}
