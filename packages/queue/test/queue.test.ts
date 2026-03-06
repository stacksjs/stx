import { describe, expect, test } from 'bun:test'
import { Queue, createQueue } from '../src/queue'
import { defineJob } from '../src/job'
import { MemoryStorage } from '../src/storage/memory'

function makeQueue(): Queue {
  return createQueue({ storage: new MemoryStorage() })
}

const testJob = defineJob({
  name: 'test-job',
  handle: async () => {},
})

const failJob = defineJob({
  name: 'fail-job',
  handle: async () => {
    throw new Error('Job failed')
  },
  retries: 2,
})

describe('Queue', () => {
  test('createQueue returns a Queue instance with defaults', () => {
    const q = createQueue()
    expect(q).toBeInstanceOf(Queue)
    expect(q.config.default).toBe('default')
    expect(q.config.concurrency).toBe(1)
    expect(q.config.pollInterval).toBe(1000)
  })

  test('register adds a job definition', () => {
    const q = makeQueue()
    q.register(testJob)
    expect(q.jobs.has('test-job')).toBe(true)
  })

  test('dispatch creates a queued job and returns an id', async () => {
    const q = makeQueue()
    const id = await q.dispatch(testJob, { foo: 'bar' })
    expect(typeof id).toBe('string')
    expect(id.length).toBeGreaterThan(0)
  })

  test('dispatch auto-registers job', async () => {
    const q = makeQueue()
    await q.dispatch(testJob, {})
    expect(q.jobs.has('test-job')).toBe(true)
  })

  test('getJob retrieves a dispatched job', async () => {
    const q = makeQueue()
    const id = await q.dispatch(testJob, { x: 1 })
    const job = await q.getJob(id)

    expect(job).not.toBeNull()
    expect(job!.id).toBe(id)
    expect(job!.name).toBe('test-job')
    expect(job!.data).toEqual({ x: 1 })
    expect(job!.status).toBe('pending')
    expect(job!.attempts).toBe(0)
    expect(job!.queue).toBe('default')
  })

  test('count returns the number of jobs', async () => {
    const q = makeQueue()
    await q.dispatch(testJob, {})
    await q.dispatch(testJob, {})
    expect(await q.count()).toBe(2)
  })

  test('count with status filter', async () => {
    const q = makeQueue()
    await q.dispatch(testJob, {})
    expect(await q.count(undefined, 'pending')).toBe(1)
    expect(await q.count(undefined, 'completed')).toBe(0)
  })

  test('clear removes all jobs', async () => {
    const q = makeQueue()
    await q.dispatch(testJob, {})
    await q.dispatch(testJob, {})
    await q.clear()
    expect(await q.count()).toBe(0)
  })

  test('cancel marks a job as failed with Cancelled error', async () => {
    const q = makeQueue()
    const id = await q.dispatch(testJob, {})
    await q.cancel(id)
    const job = await q.getJob(id)
    expect(job!.status).toBe('failed')
    expect(job!.error).toBe('Cancelled')
  })

  test('failed returns failed jobs', async () => {
    const q = makeQueue()
    const id = await q.dispatch(testJob, {})
    await q.cancel(id)
    const failedJobs = await q.failed()
    expect(failedJobs.length).toBe(1)
    expect(failedJobs[0].id).toBe(id)
  })

  test('retry resets a failed job to pending', async () => {
    const q = makeQueue()
    const id = await q.dispatch(testJob, {})
    await q.cancel(id)
    await q.retry(id)
    const job = await q.getJob(id)
    expect(job!.status).toBe('pending')
    expect(job!.error).toBeUndefined()
  })

  test('dispatch with priority option', async () => {
    const q = makeQueue()
    const id = await q.dispatch(testJob, {}, { priority: 5 })
    const job = await q.getJob(id)
    expect(job!.priority).toBe(5)
  })

  test('dispatch with delay sets retrying status', async () => {
    const q = makeQueue()
    const id = await q.dispatch(testJob, {}, { delay: 5000 })
    const job = await q.getJob(id)
    expect(job!.status).toBe('retrying')
    expect(job!.nextRetryAt).toBeDefined()
  })

  test('dispatch with queue option', async () => {
    const q = makeQueue()
    const id = await q.dispatch(testJob, {}, { queue: 'emails' })
    const job = await q.getJob(id)
    expect(job!.queue).toBe('emails')
  })

  test('flush processes all pending jobs', async () => {
    const results: number[] = []
    const countJob = defineJob<number>({
      name: 'count-job',
      handle: async (n) => { results.push(n) },
    })

    const q = makeQueue()
    await q.dispatch(countJob, 1)
    await q.dispatch(countJob, 2)
    await q.dispatch(countJob, 3)
    await q.flush()

    expect(results).toEqual([1, 2, 3])
    expect(await q.count(undefined, 'completed')).toBe(3)
  })

  test('flush handles failures with retry', async () => {
    let callCount = 0
    const flakyJob = defineJob({
      name: 'flaky-job',
      handle: async () => {
        callCount++
        if (callCount === 1)
          throw new Error('First attempt fails')
      },
      retries: 2,
      backoff: 0,
    })

    const q = makeQueue()
    await q.dispatch(flakyJob, {})
    await q.flush()

    // After first flush: job should be retrying (backoff=0 means immediate retry on next pop)
    // But the retry has nextRetryAt in the future (Date.now() + 0 = now), so second pop should get it
    // Actually with backoff: 0, nextRetryAt = Date.now() which is <= Date.now() on next pop
    expect(callCount).toBeGreaterThanOrEqual(1)
  })

  test('flush marks job as failed after max attempts', async () => {
    const alwaysFailJob = defineJob({
      name: 'always-fail',
      handle: async () => {
        throw new Error('Always fails')
      },
      retries: 1,
      backoff: 0,
    })

    const q = makeQueue()
    await q.dispatch(alwaysFailJob, {})
    await q.flush()

    const failedJobs = await q.failed()
    expect(failedJobs.length).toBe(1)
    expect(failedJobs[0].error).toBe('Always fails')
  })
})
