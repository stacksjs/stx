export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'retrying'

export interface JobDefinition<T = unknown> {
  name: string
  handle: (data: T) => Promise<void> | void
  retries?: number
  backoff?: number
  timeout?: number
  priority?: number
  queue?: string
}

export interface QueueConfig {
  default: string
  storage: QueueStorage
  concurrency?: number
  pollInterval?: number
}

export interface QueuedJob<T = unknown> {
  id: string
  name: string
  data: T
  status: JobStatus
  attempts: number
  maxAttempts: number
  priority: number
  queue: string
  createdAt: number
  startedAt?: number
  completedAt?: number
  failedAt?: number
  error?: string
  nextRetryAt?: number
}

export interface QueueStorage {
  push(job: QueuedJob): Promise<void>
  pop(queue?: string): Promise<QueuedJob | null>
  update(id: string, updates: Partial<QueuedJob>): Promise<void>
  get(id: string): Promise<QueuedJob | null>
  getByStatus(status: JobStatus, queue?: string): Promise<QueuedJob[]>
  count(queue?: string, status?: JobStatus): Promise<number>
  clear(queue?: string): Promise<void>
  failed(queue?: string): Promise<QueuedJob[]>
  retry(id: string): Promise<void>
  remove(id: string): Promise<void>
}

export interface ScheduleConfig {
  cron?: string
  every?: number
  timezone?: string
}
