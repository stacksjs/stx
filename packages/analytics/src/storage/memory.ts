import type { AnalyticsEvent, AnalyticsQuery, AnalyticsResult, AnalyticsStorage, PageView } from '../types'

export class MemoryAnalyticsStorage implements AnalyticsStorage {
  pageViews: PageView[] = []
  events: AnalyticsEvent[] = []

  async savePageView(view: PageView): Promise<void> {
    this.pageViews.push(view)
  }

  async saveEvent(event: AnalyticsEvent): Promise<void> {
    this.events.push(event)
  }

  async getPageViews(query?: AnalyticsQuery): Promise<PageView[]> {
    let views = [...this.pageViews]
    views = filterByQuery(views, query)

    if (query?.limit) {
      views = views.slice(0, query.limit)
    }

    return views
  }

  async getEvents(query?: AnalyticsQuery): Promise<AnalyticsEvent[]> {
    let events = [...this.events]

    if (query?.from) {
      const fromTs = query.from.getTime()
      events = events.filter(e => e.timestamp >= fromTs)
    }
    if (query?.to) {
      const toTs = query.to.getTime()
      events = events.filter(e => e.timestamp <= toTs)
    }
    if (query?.event) {
      events = events.filter(e => e.name === query.event)
    }
    if (query?.path) {
      events = events.filter(e => e.path === query.path)
    }
    if (query?.limit) {
      events = events.slice(0, query.limit)
    }

    return events
  }

  async getStats(query?: AnalyticsQuery): Promise<AnalyticsResult> {
    const views = await this.getPageViews(query)
    const events = await this.getEvents(query)

    const totalPageViews = views.length

    const sessionIds = new Set<string>()
    for (const v of views) {
      if (v.sessionId) {
        sessionIds.add(v.sessionId)
      }
    }
    const uniqueVisitors = sessionIds.size

    // Top pages
    const pageCounts = new Map<string, number>()
    for (const v of views) {
      pageCounts.set(v.path, (pageCounts.get(v.path) || 0) + 1)
    }
    const topPages = Array.from(pageCounts.entries())
      .map(([path, viewCount]) => ({ path, views: viewCount }))
      .sort((a, b) => b.views - a.views)

    // Top referrers
    const referrerCounts = new Map<string, number>()
    for (const v of views) {
      if (v.referrer) {
        referrerCounts.set(v.referrer, (referrerCounts.get(v.referrer) || 0) + 1)
      }
    }
    const topReferrers = Array.from(referrerCounts.entries())
      .map(([referrer, count]) => ({ referrer, count }))
      .sort((a, b) => b.count - a.count)

    // Top countries
    const countryCounts = new Map<string, number>()
    for (const v of views) {
      if (v.country) {
        countryCounts.set(v.country, (countryCounts.get(v.country) || 0) + 1)
      }
    }
    const topCountries = Array.from(countryCounts.entries())
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)

    // Average duration
    const viewsWithDuration = views.filter(v => v.duration != null)
    const averageDuration = viewsWithDuration.length > 0
      ? viewsWithDuration.reduce((sum, v) => sum + (v.duration || 0), 0) / viewsWithDuration.length
      : undefined

    // Events aggregation
    const eventCounts = new Map<string, number>()
    for (const e of events) {
      eventCounts.set(e.name, (eventCounts.get(e.name) || 0) + 1)
    }
    const eventStats = Array.from(eventCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)

    // Group by period
    let pageViewsByPeriod: Array<{ period: string, count: number }> | undefined
    if (query?.groupBy === 'day' || query?.groupBy === 'week' || query?.groupBy === 'month') {
      const periodCounts = new Map<string, number>()
      for (const v of views) {
        const period = getPeriodKey(v.timestamp, query.groupBy)
        periodCounts.set(period, (periodCounts.get(period) || 0) + 1)
      }
      pageViewsByPeriod = Array.from(periodCounts.entries())
        .map(([period, count]) => ({ period, count }))
        .sort((a, b) => a.period.localeCompare(b.period))
    }

    return {
      totalPageViews,
      uniqueVisitors,
      topPages,
      topReferrers,
      topCountries,
      pageViewsByPeriod,
      events: eventStats.length > 0 ? eventStats : undefined,
      averageDuration,
    }
  }

  async clear(): Promise<void> {
    this.pageViews = []
    this.events = []
  }

  async count(): Promise<number> {
    return this.pageViews.length + this.events.length
  }
}

function filterByQuery(views: PageView[], query?: AnalyticsQuery): PageView[] {
  if (!query)
    return views

  if (query.from) {
    const fromTs = query.from.getTime()
    views = views.filter(v => v.timestamp >= fromTs)
  }
  if (query.to) {
    const toTs = query.to.getTime()
    views = views.filter(v => v.timestamp <= toTs)
  }
  if (query.path) {
    views = views.filter(v => v.path === query.path)
  }

  return views
}

function getPeriodKey(timestamp: number, groupBy: 'day' | 'week' | 'month'): string {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  if (groupBy === 'day') {
    return `${year}-${month}-${day}`
  }

  if (groupBy === 'month') {
    return `${year}-${month}`
  }

  // week: use ISO week start (Monday)
  const d = new Date(timestamp)
  const dayOfWeek = d.getDay()
  const diff = d.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
  const monday = new Date(d.setDate(diff))
  const wYear = monday.getFullYear()
  const wMonth = String(monday.getMonth() + 1).padStart(2, '0')
  const wDay = String(monday.getDate()).padStart(2, '0')
  return `${wYear}-${wMonth}-${wDay}`
}
