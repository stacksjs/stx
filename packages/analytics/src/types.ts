export interface PageView {
  id: string
  path: string
  referrer?: string
  userAgent?: string
  country?: string
  timestamp: number
  sessionId?: string
  duration?: number
}

export interface AnalyticsEvent {
  id: string
  name: string
  data?: Record<string, unknown>
  path?: string
  timestamp: number
  sessionId?: string
}

export interface AnalyticsQuery {
  from?: Date
  to?: Date
  path?: string
  event?: string
  limit?: number
  groupBy?: 'day' | 'week' | 'month' | 'path' | 'referrer' | 'country'
}

export interface AnalyticsResult {
  totalPageViews: number
  uniqueVisitors: number
  topPages: Array<{ path: string, views: number }>
  topReferrers: Array<{ referrer: string, count: number }>
  topCountries: Array<{ country: string, count: number }>
  pageViewsByPeriod?: Array<{ period: string, count: number }>
  events?: Array<{ name: string, count: number }>
  averageDuration?: number
}

export interface AnalyticsConfig {
  storage: AnalyticsStorage
  anonymize?: boolean
  ignorePaths?: string[]
  sessionTimeout?: number
}

export interface AnalyticsStorage {
  savePageView(view: PageView): Promise<void>
  saveEvent(event: AnalyticsEvent): Promise<void>
  getPageViews(query?: AnalyticsQuery): Promise<PageView[]>
  getEvents(query?: AnalyticsQuery): Promise<AnalyticsEvent[]>
  getStats(query?: AnalyticsQuery): Promise<AnalyticsResult>
  clear(): Promise<void>
  count(): Promise<number>
}
