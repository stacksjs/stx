import { describe, expect, test } from 'bun:test'
import { defineJob } from '../src/job'

describe('defineJob', () => {
  test('creates a job definition with defaults', () => {
    const job = defineJob({
      name: 'test-job',
      handle: async () => {},
    })

    expect(job.name).toBe('test-job')
    expect(job.retries).toBe(3)
    expect(job.backoff).toBe(1000)
    expect(job.timeout).toBe(30000)
    expect(job.priority).toBe(0)
    expect(job.queue).toBe('default')
    expect(typeof job.handle).toBe('function')
  })

  test('preserves custom values', () => {
    const handler = async (data: { email: string }) => {
      void data
    }

    const job = defineJob({
      name: 'send-email',
      handle: handler,
      retries: 5,
      backoff: 5000,
      timeout: 60000,
      priority: 10,
      queue: 'emails',
    })

    expect(job.name).toBe('send-email')
    expect(job.retries).toBe(5)
    expect(job.backoff).toBe(5000)
    expect(job.timeout).toBe(60000)
    expect(job.priority).toBe(10)
    expect(job.queue).toBe('emails')
  })

  test('handles synchronous handler', () => {
    const job = defineJob({
      name: 'sync-job',
      handle: () => {},
    })

    expect(job.name).toBe('sync-job')
    expect(typeof job.handle).toBe('function')
  })
})
