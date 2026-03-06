import type { AnalyticsConfig, AnalyticsEvent, AnalyticsQuery, AnalyticsResult, AnalyticsStorage, PageView } from './types'
import { MemoryAnalyticsStorage } from './storage/memory'
import { shouldTrack } from './tracker'

export class AnalyticsEngine {
  config: AnalyticsConfig
  storage: AnalyticsStorage

  constructor(config: AnalyticsConfig) {
    this.config = {
      anonymize: true,
      sessionTimeout: 1800000,
      ...config,
    }
    this.storage = this.config.storage
  }

  async trackPageView(
    request: Request | { path: string, referrer?: string, userAgent?: string, sessionId?: string },
  ): Promise<PageView> {
    let path: string
    let referrer: string | undefined
    let userAgent: string | undefined
    let sessionId: string | undefined

    if (request instanceof Request) {
      const url = new URL(request.url)
      path = url.pathname
      referrer = request.headers.get('referer') || undefined
      userAgent = request.headers.get('user-agent') || undefined
    }
    else {
      path = request.path
      referrer = request.referrer
      userAgent = request.userAgent
      sessionId = request.sessionId
    }

    if (!shouldTrack(path, this.config)) {
      throw new Error(`Path "${path}" is excluded from tracking`)
    }

    const view: PageView = {
      id: generateId(),
      path,
      referrer,
      userAgent,
      timestamp: Date.now(),
      sessionId,
    }

    await this.storage.savePageView(view)
    return view
  }

  async trackEvent(name: string, data?: Record<string, unknown>): Promise<AnalyticsEvent> {
    const event: AnalyticsEvent = {
      id: generateId(),
      name,
      data,
      timestamp: Date.now(),
    }

    await this.storage.saveEvent(event)
    return event
  }

  async getStats(query?: AnalyticsQuery): Promise<AnalyticsResult> {
    return this.storage.getStats(query)
  }

  async getPageViews(query?: AnalyticsQuery): Promise<PageView[]> {
    return this.storage.getPageViews(query)
  }

  async getEvents(query?: AnalyticsQuery): Promise<AnalyticsEvent[]> {
    return this.storage.getEvents(query)
  }
}

let _engine: AnalyticsEngine | null = null

export function configureAnalytics(config: Partial<AnalyticsConfig>): void {
  const fullConfig: AnalyticsConfig = {
    storage: config.storage || new MemoryAnalyticsStorage(),
    anonymize: config.anonymize ?? true,
    ignorePaths: config.ignorePaths,
    sessionTimeout: config.sessionTimeout ?? 1800000,
  }
  _engine = new AnalyticsEngine(fullConfig)
}

export function resetAnalytics(): void {
  _engine = null
}

export async function getAnalytics(query?: AnalyticsQuery): Promise<AnalyticsResult> {
  const engine = getAnalyticsEngine()
  return engine.getStats(query)
}

export function getAnalyticsEngine(): AnalyticsEngine {
  if (!_engine) {
    _engine = new AnalyticsEngine({
      storage: new MemoryAnalyticsStorage(),
      anonymize: true,
      sessionTimeout: 1800000,
    })
  }
  return _engine
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}
