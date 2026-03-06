import type { JobDefinition, ScheduleConfig } from './types'
import type { Queue } from './queue'

interface ScheduledEntry {
  definition: JobDefinition
  data: unknown
  config: ScheduleConfig
  timer?: ReturnType<typeof setInterval>
}

function generateScheduleId(): string {
  try {
    return crypto.randomUUID()
  }
  catch {
    return `sched-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
  }
}

function isValidCron(expr: string): boolean {
  const parts = expr.trim().split(/\s+/)
  return parts.length === 5 || parts.length === 6
}

export class Scheduler {
  jobs: Map<string, ScheduledEntry> = new Map()
  private queue: Queue
  private running: boolean = false

  constructor(queue: Queue) {
    this.queue = queue
  }

  schedule<T>(job: JobDefinition<T>, data: T, config: ScheduleConfig): string {
    if (config.cron && !isValidCron(config.cron)) {
      throw new Error(`Invalid cron expression: ${config.cron}`)
    }

    if (!config.every && !config.cron) {
      throw new Error('Schedule config must have either "every" or "cron"')
    }

    const id = generateScheduleId()
    const entry: ScheduledEntry = {
      definition: job as JobDefinition,
      data,
      config,
    }

    this.jobs.set(id, entry)

    if (this.running && config.every) {
      entry.timer = setInterval(() => {
        this.queue.dispatch(job, data)
      }, config.every)
    }

    return id
  }

  unschedule(id: string): void {
    const entry = this.jobs.get(id)
    if (entry?.timer) {
      clearInterval(entry.timer)
    }
    this.jobs.delete(id)
  }

  start(): void {
    this.running = true
    for (const [, entry] of this.jobs) {
      if (entry.config.every && !entry.timer) {
        entry.timer = setInterval(() => {
          this.queue.dispatch(entry.definition, entry.data)
        }, entry.config.every)
      }
    }
  }

  stop(): void {
    this.running = false
    for (const [, entry] of this.jobs) {
      if (entry.timer) {
        clearInterval(entry.timer)
        entry.timer = undefined
      }
    }
  }

  getScheduled(): Array<{ id: string, job: string, config: ScheduleConfig }> {
    const result: Array<{ id: string, job: string, config: ScheduleConfig }> = []
    for (const [id, entry] of this.jobs) {
      result.push({
        id,
        job: entry.definition.name,
        config: entry.config,
      })
    }
    return result
  }
}
