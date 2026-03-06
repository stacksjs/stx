import type { CacheDriver } from '../types'
import { Database } from 'bun:sqlite'

export class SqliteDriver implements CacheDriver {
  private db: Database
  private defaultTTL: number | undefined

  constructor(path = ':memory:', defaultTTL?: number) {
    this.db = new Database(path)
    this.defaultTTL = defaultTTL

    this.db.run(`
      CREATE TABLE IF NOT EXISTS cache (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        expires_at INTEGER
      )
    `)
  }

  async get<T>(key: string): Promise<T | null> {
    const row = this.db.query<{ value: string, expires_at: number | null }, [string]>(
      'SELECT value, expires_at FROM cache WHERE key = ?',
    ).get(key)

    if (!row)
      return null

    if (row.expires_at !== null && Date.now() > row.expires_at) {
      this.db.run('DELETE FROM cache WHERE key = ?', [key])
      return null
    }

    try {
      return JSON.parse(row.value) as T
    }
    catch {
      return null
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const effectiveTTL = ttl ?? this.defaultTTL
    const expiresAt = effectiveTTL ? Date.now() + effectiveTTL * 1000 : null

    this.db.run(
      'INSERT OR REPLACE INTO cache (key, value, expires_at) VALUES (?, ?, ?)',
      [key, JSON.stringify(value), expiresAt],
    )
  }

  async has(key: string): Promise<boolean> {
    const result = await this.get(key)
    return result !== null
  }

  async delete(key: string): Promise<void> {
    this.db.run('DELETE FROM cache WHERE key = ?', [key])
  }

  async flush(): Promise<void> {
    this.db.run('DELETE FROM cache')
  }

  close(): void {
    this.db.close()
  }
}
