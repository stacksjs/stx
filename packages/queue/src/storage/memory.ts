import type { JobStatus, QueueStorage, QueuedJob } from '../types'

export class MemoryStorage implements QueueStorage {
  jobs: Map<string, QueuedJob> = new Map()

  async push(job: QueuedJob): Promise<void> {
    this.jobs.set(job.id, { ...job })
  }

  async pop(queue?: string): Promise<QueuedJob | null> {
    const now = Date.now()
    let best: QueuedJob | null = null

    for (const job of this.jobs.values()) {
      if (job.status !== 'pending' && job.status !== 'retrying')
        continue

      if (queue && job.queue !== queue)
        continue

      // Skip jobs that have a future retry time
      if (job.status === 'retrying' && job.nextRetryAt && job.nextRetryAt > now)
        continue

      if (!best || job.priority > best.priority || (job.priority === best.priority && job.createdAt < best.createdAt)) {
        best = job
      }
    }

    if (best) {
      best.status = 'processing'
      best.startedAt = now
      this.jobs.set(best.id, { ...best })
      return { ...best }
    }

    return null
  }

  async update(id: string, updates: Partial<QueuedJob>): Promise<void> {
    const job = this.jobs.get(id)
    if (job) {
      Object.assign(job, updates)
      this.jobs.set(id, { ...job })
    }
  }

  async get(id: string): Promise<QueuedJob | null> {
    const job = this.jobs.get(id)
    return job ? { ...job } : null
  }

  async getByStatus(status: JobStatus, queue?: string): Promise<QueuedJob[]> {
    const results: QueuedJob[] = []
    for (const job of this.jobs.values()) {
      if (job.status === status && (!queue || job.queue === queue)) {
        results.push({ ...job })
      }
    }
    return results
  }

  async count(queue?: string, status?: JobStatus): Promise<number> {
    let n = 0
    for (const job of this.jobs.values()) {
      if (queue && job.queue !== queue)
        continue
      if (status && job.status !== status)
        continue
      n++
    }
    return n
  }

  async clear(queue?: string): Promise<void> {
    if (!queue) {
      this.jobs.clear()
      return
    }
    for (const [id, job] of this.jobs) {
      if (job.queue === queue)
        this.jobs.delete(id)
    }
  }

  async failed(queue?: string): Promise<QueuedJob[]> {
    return this.getByStatus('failed', queue)
  }

  async retry(id: string): Promise<void> {
    const job = this.jobs.get(id)
    if (job) {
      job.status = 'pending'
      job.error = undefined
      job.failedAt = undefined
      job.nextRetryAt = undefined
      this.jobs.set(id, { ...job })
    }
  }

  async remove(id: string): Promise<void> {
    this.jobs.delete(id)
  }
}
