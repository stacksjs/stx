import type { JobDefinition, JobStatus, QueueConfig, QueuedJob } from './types'
import { MemoryStorage } from './storage/memory'

let defaultQueue: Queue | undefined

function generateId(): string {
  try {
    return crypto.randomUUID()
  }
  catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
  }
}

export class Queue {
  config: QueueConfig
  jobs: Map<string, JobDefinition> = new Map()

  constructor(config: QueueConfig) {
    this.config = config
  }

  register(job: JobDefinition): void {
    this.jobs.set(job.name, job)
  }

  async dispatch<T>(
    job: JobDefinition<T>,
    data: T,
    options?: { priority?: number, delay?: number, queue?: string },
  ): Promise<string> {
    // Auto-register if not already registered
    if (!this.jobs.has(job.name)) {
      this.register(job as JobDefinition)
    }

    const id = generateId()
    const now = Date.now()

    const queuedJob: QueuedJob<T> = {
      id,
      name: job.name,
      data,
      status: options?.delay ? 'retrying' : 'pending',
      attempts: 0,
      maxAttempts: job.retries ?? 3,
      priority: options?.priority ?? job.priority ?? 0,
      queue: options?.queue ?? job.queue ?? this.config.default,
      createdAt: now,
      nextRetryAt: options?.delay ? now + options.delay : undefined,
    }

    await this.config.storage.push(queuedJob as QueuedJob)
    return id
  }

  async getJob(id: string): Promise<QueuedJob | null> {
    return this.config.storage.get(id)
  }

  async retry(id: string): Promise<void> {
    return this.config.storage.retry(id)
  }

  async cancel(id: string): Promise<void> {
    const job = await this.config.storage.get(id)
    if (job) {
      await this.config.storage.update(id, { status: 'failed', error: 'Cancelled', failedAt: Date.now() })
    }
  }

  async count(queue?: string, status?: JobStatus): Promise<number> {
    return this.config.storage.count(queue, status)
  }

  async failed(queue?: string): Promise<QueuedJob[]> {
    return this.config.storage.failed(queue)
  }

  async clear(queue?: string): Promise<void> {
    return this.config.storage.clear(queue)
  }

  async flush(): Promise<void> {
    let job = await this.config.storage.pop(this.config.default)
    while (job) {
      const definition = this.jobs.get(job.name)
      if (definition) {
        try {
          await definition.handle(job.data)
          await this.config.storage.update(job.id, {
            status: 'completed',
            completedAt: Date.now(),
            attempts: job.attempts + 1,
          })
        }
        catch (err) {
          const attempts = job.attempts + 1
          if (attempts < job.maxAttempts) {
            const backoff = definition.backoff ?? 1000
            await this.config.storage.update(job.id, {
              status: 'retrying',
              attempts,
              error: err instanceof Error ? err.message : String(err),
              nextRetryAt: Date.now() + backoff,
            })
          }
          else {
            await this.config.storage.update(job.id, {
              status: 'failed',
              attempts,
              error: err instanceof Error ? err.message : String(err),
              failedAt: Date.now(),
            })
          }
        }
      }
      job = await this.config.storage.pop(this.config.default)
    }
  }
}

export function createQueue(config?: Partial<QueueConfig>): Queue {
  const fullConfig: QueueConfig = {
    default: config?.default ?? 'default',
    storage: config?.storage ?? new MemoryStorage(),
    concurrency: config?.concurrency ?? 1,
    pollInterval: config?.pollInterval ?? 1000,
  }
  const q = new Queue(fullConfig)
  if (!defaultQueue)
    defaultQueue = q
  return q
}

export async function dispatch<T>(
  job: JobDefinition<T>,
  data: T,
  options?: { priority?: number, delay?: number },
): Promise<string> {
  if (!defaultQueue) {
    defaultQueue = createQueue()
  }
  return defaultQueue.dispatch(job, data, options)
}
