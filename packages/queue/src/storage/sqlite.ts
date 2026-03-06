import type { JobStatus, QueueStorage, QueuedJob } from '../types'

/**
 * SQLite-backed queue storage.
 *
 * This class defines the interface and structure for SQLite storage.
 * To use it, provide a `db` object that implements the expected query interface
 * (e.g., from `bun:sqlite`).
 *
 * The actual `bun:sqlite` import is intentionally omitted to avoid
 * hard-coupling this package to Bun's native SQLite module.
 */

export interface SqliteDb {
  run(sql: string, ...params: unknown[]): void
  query(sql: string): {
    all(...params: unknown[]): Record<string, unknown>[]
    get(...params: unknown[]): Record<string, unknown> | null
  }
}

export class SqliteStorage implements QueueStorage {
  private db: SqliteDb

  constructor(db: SqliteDb) {
    this.db = db
    this.initialize()
  }

  private initialize(): void {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS queue_jobs (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        data TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        attempts INTEGER NOT NULL DEFAULT 0,
        max_attempts INTEGER NOT NULL DEFAULT 3,
        priority INTEGER NOT NULL DEFAULT 0,
        queue TEXT NOT NULL DEFAULT 'default',
        created_at INTEGER NOT NULL,
        started_at INTEGER,
        completed_at INTEGER,
        failed_at INTEGER,
        error TEXT,
        next_retry_at INTEGER
      )
    `)
  }

  private rowToJob(row: Record<string, unknown>): QueuedJob {
    return {
      id: row.id as string,
      name: row.name as string,
      data: JSON.parse(row.data as string),
      status: row.status as JobStatus,
      attempts: row.attempts as number,
      maxAttempts: row.max_attempts as number,
      priority: row.priority as number,
      queue: row.queue as string,
      createdAt: row.created_at as number,
      startedAt: row.started_at as number | undefined,
      completedAt: row.completed_at as number | undefined,
      failedAt: row.failed_at as number | undefined,
      error: row.error as string | undefined,
      nextRetryAt: row.next_retry_at as number | undefined,
    }
  }

  async push(job: QueuedJob): Promise<void> {
    this.db.run(
      `INSERT INTO queue_jobs (id, name, data, status, attempts, max_attempts, priority, queue, created_at, started_at, completed_at, failed_at, error, next_retry_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      job.id,
      job.name,
      JSON.stringify(job.data),
      job.status,
      job.attempts,
      job.maxAttempts,
      job.priority,
      job.queue,
      job.createdAt,
      job.startedAt ?? null,
      job.completedAt ?? null,
      job.failedAt ?? null,
      job.error ?? null,
      job.nextRetryAt ?? null,
    )
  }

  async pop(queue?: string): Promise<QueuedJob | null> {
    const now = Date.now()
    const q = queue ?? 'default'
    const row = this.db.query(
      `SELECT * FROM queue_jobs
       WHERE (status = 'pending' OR (status = 'retrying' AND (next_retry_at IS NULL OR next_retry_at <= ?)))
       AND queue = ?
       ORDER BY priority DESC, created_at ASC
       LIMIT 1`,
    ).get(now, q)

    if (!row)
      return null

    const job = this.rowToJob(row)
    job.status = 'processing'
    job.startedAt = now

    this.db.run(
      `UPDATE queue_jobs SET status = 'processing', started_at = ? WHERE id = ?`,
      now,
      job.id,
    )

    return job
  }

  async update(id: string, updates: Partial<QueuedJob>): Promise<void> {
    const fields: string[] = []
    const values: unknown[] = []

    const mapping: Record<string, string> = {
      status: 'status',
      attempts: 'attempts',
      maxAttempts: 'max_attempts',
      priority: 'priority',
      queue: 'queue',
      startedAt: 'started_at',
      completedAt: 'completed_at',
      failedAt: 'failed_at',
      error: 'error',
      nextRetryAt: 'next_retry_at',
      data: 'data',
    }

    for (const [key, column] of Object.entries(mapping)) {
      if (key in updates) {
        fields.push(`${column} = ?`)
        const val = (updates as Record<string, unknown>)[key]
        values.push(key === 'data' ? JSON.stringify(val) : val ?? null)
      }
    }

    if (fields.length === 0)
      return

    values.push(id)
    this.db.run(`UPDATE queue_jobs SET ${fields.join(', ')} WHERE id = ?`, ...values)
  }

  async get(id: string): Promise<QueuedJob | null> {
    const row = this.db.query(`SELECT * FROM queue_jobs WHERE id = ?`).get(id)
    return row ? this.rowToJob(row) : null
  }

  async getByStatus(status: JobStatus, queue?: string): Promise<QueuedJob[]> {
    const rows = queue
      ? this.db.query(`SELECT * FROM queue_jobs WHERE status = ? AND queue = ?`).all(status, queue)
      : this.db.query(`SELECT * FROM queue_jobs WHERE status = ?`).all(status)
    return rows.map(r => this.rowToJob(r))
  }

  async count(queue?: string, status?: JobStatus): Promise<number> {
    let sql = `SELECT COUNT(*) as cnt FROM queue_jobs WHERE 1=1`
    const params: unknown[] = []
    if (queue) {
      sql += ` AND queue = ?`
      params.push(queue)
    }
    if (status) {
      sql += ` AND status = ?`
      params.push(status)
    }
    const row = this.db.query(sql).get(...params)
    return (row as Record<string, number>)?.cnt ?? 0
  }

  async clear(queue?: string): Promise<void> {
    if (queue) {
      this.db.run(`DELETE FROM queue_jobs WHERE queue = ?`, queue)
    }
    else {
      this.db.run(`DELETE FROM queue_jobs`)
    }
  }

  async failed(queue?: string): Promise<QueuedJob[]> {
    return this.getByStatus('failed', queue)
  }

  async retry(id: string): Promise<void> {
    this.db.run(
      `UPDATE queue_jobs SET status = 'pending', error = NULL, failed_at = NULL, next_retry_at = NULL WHERE id = ?`,
      id,
    )
  }

  async remove(id: string): Promise<void> {
    this.db.run(`DELETE FROM queue_jobs WHERE id = ?`, id)
  }
}
