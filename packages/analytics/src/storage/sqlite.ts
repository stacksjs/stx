import type { AnalyticsEvent, AnalyticsQuery, AnalyticsResult, AnalyticsStorage, PageView } from '../types'

/**
 * SQLite-based analytics storage.
 *
 * This is an interface-only implementation placeholder for production use.
 * To use SQLite storage, provide a configured Bun SQLite database instance.
 */
export class SqliteAnalyticsStorage implements AnalyticsStorage {
  private db: unknown

  constructor(db: unknown) {
    this.db = db
    void this.db
  }

  async savePageView(_view: PageView): Promise<void> {
    throw new Error('SqliteAnalyticsStorage is not yet implemented. Use MemoryAnalyticsStorage for development.')
  }

  async saveEvent(_event: AnalyticsEvent): Promise<void> {
    throw new Error('SqliteAnalyticsStorage is not yet implemented. Use MemoryAnalyticsStorage for development.')
  }

  async getPageViews(_query?: AnalyticsQuery): Promise<PageView[]> {
    throw new Error('SqliteAnalyticsStorage is not yet implemented. Use MemoryAnalyticsStorage for development.')
  }

  async getEvents(_query?: AnalyticsQuery): Promise<AnalyticsEvent[]> {
    throw new Error('SqliteAnalyticsStorage is not yet implemented. Use MemoryAnalyticsStorage for development.')
  }

  async getStats(_query?: AnalyticsQuery): Promise<AnalyticsResult> {
    throw new Error('SqliteAnalyticsStorage is not yet implemented. Use MemoryAnalyticsStorage for development.')
  }

  async clear(): Promise<void> {
    throw new Error('SqliteAnalyticsStorage is not yet implemented. Use MemoryAnalyticsStorage for development.')
  }

  async count(): Promise<number> {
    throw new Error('SqliteAnalyticsStorage is not yet implemented. Use MemoryAnalyticsStorage for development.')
  }
}
