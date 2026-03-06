import type { JobDefinition } from './types'

export function defineJob<T = unknown>(definition: JobDefinition<T>): JobDefinition<T> {
  return {
    retries: 3,
    backoff: 1000,
    timeout: 30000,
    priority: 0,
    queue: 'default',
    ...definition,
  }
}
