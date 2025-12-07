/**
 * STX Story - Component Usage Analytics
 * Track which components are viewed most, which props are changed most
 */

import fs from 'node:fs'
import path from 'node:path'

/**
 * Analytics event types
 */
export type AnalyticsEventType =
  | 'view'
  | 'prop_change'
  | 'variant_switch'
  | 'search'
  | 'bookmark'
  | 'copy_code'
  | 'test_run'

/**
 * Analytics event
 */
export interface AnalyticsEvent {
  /** Event type */
  type: AnalyticsEventType
  /** Timestamp */
  timestamp: number
  /** Component ID */
  componentId?: string
  /** Variant ID */
  variantId?: string
  /** Prop name (for prop_change) */
  propName?: string
  /** Search query (for search) */
  query?: string
  /** Additional metadata */
  metadata?: Record<string, any>
}

/**
 * Component analytics summary
 */
export interface ComponentAnalytics {
  /** Component ID */
  componentId: string
  /** Component name */
  componentName: string
  /** Total views */
  viewCount: number
  /** Unique view sessions */
  uniqueViews: number
  /** Last viewed timestamp */
  lastViewed?: number
  /** Prop change counts */
  propChanges: Record<string, number>
  /** Most changed props */
  topChangedProps: string[]
  /** Variant view counts */
  variantViews: Record<string, number>
  /** Average time spent (ms) */
  avgTimeSpent: number
}

/**
 * Analytics storage
 */
export interface AnalyticsStorage {
  version: number
  events: AnalyticsEvent[]
  sessions: AnalyticsSession[]
}

/**
 * Analytics session
 */
export interface AnalyticsSession {
  id: string
  startTime: number
  endTime?: number
  componentViews: string[]
}

const ANALYTICS_FILE = '.stx/story/analytics.json'
const STORAGE_VERSION = 1
const MAX_EVENTS = 10000

/**
 * Analytics tracker
 */
export class AnalyticsTracker {
  private storage: AnalyticsStorage
  private storagePath: string
  private currentSession: AnalyticsSession | null = null
  private dirty = false
  private viewStartTimes = new Map<string, number>()

  constructor(rootDir: string) {
    this.storagePath = path.join(rootDir, ANALYTICS_FILE)
    this.storage = this.loadStorage()
    this.startSession()
  }

  private loadStorage(): AnalyticsStorage {
    try {
      const content = fs.readFileSync(this.storagePath, 'utf-8')
      return JSON.parse(content) as AnalyticsStorage
    }
    catch {
      return { version: STORAGE_VERSION, events: [], sessions: [] }
    }
  }

  async save(): Promise<void> {
    if (!this.dirty)
      return

    const dir = path.dirname(this.storagePath)
    await fs.promises.mkdir(dir, { recursive: true })

    // Trim events if too many
    if (this.storage.events.length > MAX_EVENTS) {
      this.storage.events = this.storage.events.slice(-MAX_EVENTS)
    }

    await fs.promises.writeFile(
      this.storagePath,
      JSON.stringify(this.storage, null, 2),
    )
    this.dirty = false
  }

  /**
   * Start a new session
   */
  startSession(): void {
    this.endSession()

    this.currentSession = {
      id: generateId(),
      startTime: Date.now(),
      componentViews: [],
    }
    this.storage.sessions.push(this.currentSession)
    this.dirty = true
  }

  /**
   * End current session
   */
  endSession(): void {
    if (this.currentSession) {
      this.currentSession.endTime = Date.now()
      this.currentSession = null
    }
  }

  /**
   * Track an event
   */
  track(event: Omit<AnalyticsEvent, 'timestamp'>): void {
    this.storage.events.push({
      ...event,
      timestamp: Date.now(),
    })
    this.dirty = true
  }

  /**
   * Track component view
   */
  trackView(componentId: string, variantId?: string): void {
    // End previous view timing
    this.endViewTiming(componentId)

    // Start new view timing
    this.viewStartTimes.set(componentId, Date.now())

    this.track({
      type: 'view',
      componentId,
      variantId,
    })

    if (this.currentSession && !this.currentSession.componentViews.includes(componentId)) {
      this.currentSession.componentViews.push(componentId)
    }
  }

  /**
   * End view timing for a component
   */
  private endViewTiming(componentId: string): void {
    const startTime = this.viewStartTimes.get(componentId)
    if (startTime) {
      const duration = Date.now() - startTime
      this.track({
        type: 'view',
        componentId,
        metadata: { duration, endView: true },
      })
      this.viewStartTimes.delete(componentId)
    }
  }

  /**
   * Track prop change
   */
  trackPropChange(componentId: string, propName: string, value: any): void {
    this.track({
      type: 'prop_change',
      componentId,
      propName,
      metadata: { value },
    })
  }

  /**
   * Track variant switch
   */
  trackVariantSwitch(componentId: string, variantId: string): void {
    this.track({
      type: 'variant_switch',
      componentId,
      variantId,
    })
  }

  /**
   * Track search
   */
  trackSearch(query: string, resultCount: number): void {
    this.track({
      type: 'search',
      query,
      metadata: { resultCount },
    })
  }

  /**
   * Get analytics for a component
   */
  getComponentAnalytics(componentId: string, componentName: string): ComponentAnalytics {
    const events = this.storage.events.filter(e => e.componentId === componentId)

    const viewEvents = events.filter(e => e.type === 'view' && !e.metadata?.endView)
    const propChangeEvents = events.filter(e => e.type === 'prop_change')
    const variantEvents = events.filter(e => e.type === 'variant_switch')

    // Count prop changes
    const propChanges: Record<string, number> = {}
    for (const event of propChangeEvents) {
      if (event.propName) {
        propChanges[event.propName] = (propChanges[event.propName] || 0) + 1
      }
    }

    // Count variant views
    const variantViews: Record<string, number> = {}
    for (const event of variantEvents) {
      if (event.variantId) {
        variantViews[event.variantId] = (variantViews[event.variantId] || 0) + 1
      }
    }

    // Calculate unique views (by session)
    const sessionsWithView = new Set(
      this.storage.sessions
        .filter(s => s.componentViews.includes(componentId))
        .map(s => s.id),
    )

    // Calculate average time spent
    const durations = events
      .filter(e => e.metadata?.duration)
      .map(e => e.metadata!.duration as number)
    const avgTimeSpent = durations.length > 0
      ? durations.reduce((a, b) => a + b, 0) / durations.length
      : 0

    // Top changed props
    const topChangedProps = Object.entries(propChanges)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name)

    return {
      componentId,
      componentName,
      viewCount: viewEvents.length,
      uniqueViews: sessionsWithView.size,
      lastViewed: viewEvents[viewEvents.length - 1]?.timestamp,
      propChanges,
      topChangedProps,
      variantViews,
      avgTimeSpent,
    }
  }

  /**
   * Get most viewed components
   */
  getMostViewedComponents(limit = 10): Array<{ componentId: string, viewCount: number }> {
    const viewCounts = new Map<string, number>()

    for (const event of this.storage.events) {
      if (event.type === 'view' && event.componentId && !event.metadata?.endView) {
        viewCounts.set(
          event.componentId,
          (viewCounts.get(event.componentId) || 0) + 1,
        )
      }
    }

    return Array.from(viewCounts.entries())
      .map(([componentId, viewCount]) => ({ componentId, viewCount }))
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, limit)
  }

  /**
   * Get most changed props across all components
   */
  getMostChangedProps(limit = 10): Array<{ propName: string, changeCount: number }> {
    const propCounts = new Map<string, number>()

    for (const event of this.storage.events) {
      if (event.type === 'prop_change' && event.propName) {
        propCounts.set(
          event.propName,
          (propCounts.get(event.propName) || 0) + 1,
        )
      }
    }

    return Array.from(propCounts.entries())
      .map(([propName, changeCount]) => ({ propName, changeCount }))
      .sort((a, b) => b.changeCount - a.changeCount)
      .slice(0, limit)
  }

  /**
   * Get search analytics
   */
  getSearchAnalytics(): {
    totalSearches: number
    topQueries: Array<{ query: string, count: number }>
    avgResultCount: number
  } {
    const searchEvents = this.storage.events.filter(e => e.type === 'search')

    const queryCounts = new Map<string, number>()
    let totalResults = 0

    for (const event of searchEvents) {
      if (event.query) {
        queryCounts.set(event.query, (queryCounts.get(event.query) || 0) + 1)
      }
      if (event.metadata?.resultCount !== undefined) {
        totalResults += event.metadata.resultCount
      }
    }

    const topQueries = Array.from(queryCounts.entries())
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return {
      totalSearches: searchEvents.length,
      topQueries,
      avgResultCount: searchEvents.length > 0 ? totalResults / searchEvents.length : 0,
    }
  }

  /**
   * Clear all analytics
   */
  clear(): void {
    this.storage.events = []
    this.storage.sessions = []
    this.dirty = true
    this.startSession()
  }

  /**
   * Export analytics as JSON
   */
  exportAnalytics(): string {
    return JSON.stringify({
      exportedAt: Date.now(),
      ...this.storage,
    }, null, 2)
  }
}

function generateId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

/**
 * Generate analytics dashboard HTML
 */
export function getAnalyticsDashboardHtml(
  mostViewed: Array<{ componentId: string, viewCount: number }>,
  mostChangedProps: Array<{ propName: string, changeCount: number }>,
): string {
  const viewedRows = mostViewed.map(c => `
    <tr>
      <td>${c.componentId}</td>
      <td>${c.viewCount}</td>
    </tr>
  `).join('')

  const propsRows = mostChangedProps.map(p => `
    <tr>
      <td>${p.propName}</td>
      <td>${p.changeCount}</td>
    </tr>
  `).join('')

  return `
    <div class="analytics-dashboard">
      <h3>📊 Usage Analytics</h3>

      <div class="analytics-section">
        <h4>Most Viewed Components</h4>
        <table>
          <thead><tr><th>Component</th><th>Views</th></tr></thead>
          <tbody>${viewedRows || '<tr><td colspan="2">No data</td></tr>'}</tbody>
        </table>
      </div>

      <div class="analytics-section">
        <h4>Most Changed Props</h4>
        <table>
          <thead><tr><th>Prop</th><th>Changes</th></tr></thead>
          <tbody>${propsRows || '<tr><td colspan="2">No data</td></tr>'}</tbody>
        </table>
      </div>
    </div>
  `
}

/**
 * Generate analytics styles
 */
export function getAnalyticsStyles(): string {
  return `
    .analytics-dashboard {
      padding: 16px;
      background: var(--bg-secondary);
      border-radius: 8px;
    }
    .analytics-dashboard h3 {
      margin: 0 0 16px;
      font-size: 14px;
    }
    .analytics-section {
      margin-bottom: 16px;
    }
    .analytics-section h4 {
      margin: 0 0 8px;
      font-size: 12px;
      color: var(--text-secondary);
    }
    .analytics-dashboard table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    .analytics-dashboard th,
    .analytics-dashboard td {
      padding: 6px 8px;
      text-align: left;
      border-bottom: 1px solid var(--border);
    }
  `
}
