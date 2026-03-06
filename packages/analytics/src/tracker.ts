import type { AnalyticsConfig, AnalyticsEvent, PageView } from './types'
import { getAnalyticsEngine } from './analytics'

export async function trackPageView(
  request: Request | { path: string, referrer?: string, userAgent?: string, sessionId?: string },
): Promise<PageView> {
  const engine = getAnalyticsEngine()
  return engine.trackPageView(request)
}

export async function trackEvent(
  name: string,
  data?: Record<string, unknown>,
  request?: Request | { path?: string, sessionId?: string },
): Promise<AnalyticsEvent> {
  const engine = getAnalyticsEngine()

  let path: string | undefined
  let sessionId: string | undefined

  if (request) {
    if (request instanceof Request) {
      const url = new URL(request.url)
      path = url.pathname
    }
    else {
      path = request.path
      sessionId = request.sessionId
    }
  }

  const event: AnalyticsEvent = {
    id: generateId(),
    name,
    data,
    path,
    timestamp: Date.now(),
    sessionId,
  }

  await engine.storage.saveEvent(event)
  return event
}

export function shouldTrack(path: string, config: AnalyticsConfig): boolean {
  if (!config.ignorePaths || config.ignorePaths.length === 0) {
    return true
  }

  for (const pattern of config.ignorePaths) {
    if (matchGlob(path, pattern)) {
      return false
    }
  }

  return true
}

function matchGlob(path: string, pattern: string): boolean {
  // Exact match
  if (pattern === path) {
    return true
  }

  // Convert glob pattern to regex
  const regexStr = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')

  const regex = new RegExp(`^${regexStr}$`)
  return regex.test(path)
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

export { generateId }
