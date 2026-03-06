import type { Queue } from './queue'

export class Worker {
  running: boolean = false
  processed: number = 0
  failed: number = 0

  private queue: Queue
  private concurrency: number
  private pollInterval: number
  private pollTimer: ReturnType<typeof setInterval> | null = null

  constructor(queue: Queue, config?: { concurrency?: number, pollInterval?: number }) {
    this.queue = queue
    this.concurrency = config?.concurrency ?? queue.config.concurrency ?? 1
    this.pollInterval = config?.pollInterval ?? queue.config.pollInterval ?? 1000
  }

  async start(): Promise<void> {
    this.running = true
    this.poll()
  }

  async stop(): Promise<void> {
    this.running = false
    if (this.pollTimer) {
      clearInterval(this.pollTimer)
      this.pollTimer = null
    }
  }

  private poll(): void {
    this.pollTimer = setInterval(async () => {
      if (!this.running)
        return

      const promises: Promise<boolean>[] = []
      for (let i = 0; i < this.concurrency; i++) {
        promises.push(this.processNext())
      }
      await Promise.all(promises)
    }, this.pollInterval)
  }

  async processNext(): Promise<boolean> {
    const storage = this.queue.config.storage
    const job = await storage.pop(this.queue.config.default)

    if (!job)
      return false

    const definition = this.queue.jobs.get(job.name)
    if (!definition) {
      await storage.update(job.id, {
        status: 'failed',
        error: `No handler registered for job: ${job.name}`,
        failedAt: Date.now(),
        attempts: job.attempts + 1,
      })
      this.failed++
      return true
    }

    try {
      // Handle timeout
      const timeout = definition.timeout ?? 30000
      const result = definition.handle(job.data)

      if (result instanceof Promise) {
        await Promise.race([
          result,
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Job timed out')), timeout),
          ),
        ])
      }

      await storage.update(job.id, {
        status: 'completed',
        completedAt: Date.now(),
        attempts: job.attempts + 1,
      })
      this.processed++
    }
    catch (err) {
      const attempts = job.attempts + 1
      const maxAttempts = job.maxAttempts
      const errorMessage = err instanceof Error ? err.message : String(err)

      if (attempts < maxAttempts) {
        const backoff = definition.backoff ?? 1000
        await storage.update(job.id, {
          status: 'retrying',
          attempts,
          error: errorMessage,
          nextRetryAt: Date.now() + backoff,
        })
      }
      else {
        await storage.update(job.id, {
          status: 'failed',
          attempts,
          error: errorMessage,
          failedAt: Date.now(),
        })
        this.failed++
      }
    }

    return true
  }

  isRunning(): boolean {
    return this.running
  }

  getStats(): { processed: number, failed: number, running: boolean } {
    return {
      processed: this.processed,
      failed: this.failed,
      running: this.running,
    }
  }
}
