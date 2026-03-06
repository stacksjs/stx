import { describe, expect, test } from 'bun:test'
import { Worker } from '../src/worker'
import { createQueue } from '../src/queue'
import { defineJob } from '../src/job'
import { MemoryStorage } from '../src/storage/memory'

function setup() {
  const storage = new MemoryStorage()
  const queue = createQueue({ storage })
  const worker = new Worker(queue)
  return { storage, queue, worker }
}

describe('Worker', () => {
  test('processNext returns false when no jobs', async () => {
    const { worker } = setup()
    const result = await worker.processNext()
    expect(result).toBe(false)
  })

  test('processNext processes a job successfully', async () => {
    const { queue, worker } = setup()
    let handled = false

    const job = defineJob({
      name: 'success-job',
      handle: async () => { handled = true },
    })

    await queue.dispatch(job, {})
    const result = await worker.processNext()

    expect(result).toBe(true)
    expect(handled).toBe(true)
    expect(worker.processed).toBe(1)
    expect(worker.failed).toBe(0)
  })

  test('processNext sets job to completed on success', async () => {
    const { queue, worker } = setup()

    const job = defineJob({
      name: 'complete-job',
      handle: async () => {},
    })

    const id = await queue.dispatch(job, {})
    await worker.processNext()

    const queued = await queue.getJob(id)
    expect(queued!.status).toBe('completed')
    expect(queued!.completedAt).toBeDefined()
    expect(queued!.attempts).toBe(1)
  })

  test('processNext retries on failure when attempts remaining', async () => {
    const { queue, worker } = setup()

    const job = defineJob({
      name: 'retry-job',
      handle: async () => { throw new Error('oops') },
      retries: 3,
      backoff: 1000,
    })

    const id = await queue.dispatch(job, {})
    await worker.processNext()

    const queued = await queue.getJob(id)
    expect(queued!.status).toBe('retrying')
    expect(queued!.attempts).toBe(1)
    expect(queued!.error).toBe('oops')
    expect(queued!.nextRetryAt).toBeDefined()
  })

  test('processNext marks as failed after max attempts', async () => {
    const { queue, worker, storage } = setup()

    const job = defineJob({
      name: 'max-fail-job',
      handle: async () => { throw new Error('fail') },
      retries: 1,
    })

    const id = await queue.dispatch(job, {})

    // First attempt: will be retrying (attempts 1 < maxAttempts 1 is false, so fails immediately)
    await worker.processNext()

    const queued = await queue.getJob(id)
    expect(queued!.status).toBe('failed')
    expect(queued!.failedAt).toBeDefined()
    expect(queued!.error).toBe('fail')
    expect(worker.failed).toBe(1)
  })

  test('processNext fails when no handler registered', async () => {
    const { queue, worker, storage } = setup()

    // Manually push a job without registering its handler
    await storage.push({
      id: 'orphan-1',
      name: 'unknown-job',
      data: {},
      status: 'pending',
      attempts: 0,
      maxAttempts: 3,
      priority: 0,
      queue: 'default',
      createdAt: Date.now(),
    })

    await worker.processNext()

    const queued = await storage.get('orphan-1')
    expect(queued!.status).toBe('failed')
    expect(queued!.error).toContain('No handler registered')
    expect(worker.failed).toBe(1)
  })

  test('start and stop control running state', async () => {
    const { worker } = setup()

    expect(worker.isRunning()).toBe(false)

    await worker.start()
    expect(worker.isRunning()).toBe(true)

    await worker.stop()
    expect(worker.isRunning()).toBe(false)
  })

  test('getStats returns correct statistics', async () => {
    const { queue, worker } = setup()

    const successJob = defineJob({
      name: 'stat-success',
      handle: async () => {},
    })

    const failJobDef = defineJob({
      name: 'stat-fail',
      handle: async () => { throw new Error('nope') },
      retries: 1,
    })

    await queue.dispatch(successJob, {})
    await queue.dispatch(failJobDef, {})

    await worker.processNext()
    await worker.processNext()

    const stats = worker.getStats()
    expect(stats.processed).toBe(1)
    expect(stats.failed).toBe(1)
    expect(stats.running).toBe(false)
  })

  test('priority ordering: higher priority processed first', async () => {
    const { queue, worker } = setup()
    const order: string[] = []

    const lowJob = defineJob({
      name: 'low-priority',
      handle: async () => { order.push('low') },
      priority: 1,
    })

    const highJob = defineJob({
      name: 'high-priority',
      handle: async () => { order.push('high') },
      priority: 10,
    })

    await queue.dispatch(lowJob, {}, { priority: 1 })
    await queue.dispatch(highJob, {}, { priority: 10 })

    await worker.processNext()
    await worker.processNext()

    expect(order).toEqual(['high', 'low'])
  })

  test('job lifecycle: pending -> processing -> completed', async () => {
    const { queue, storage } = setup()
    const worker = new Worker(queue)

    let capturedStatus: string | undefined
    const lifecycleJob = defineJob({
      name: 'lifecycle-job',
      handle: async () => {
        // During execution, job should be in 'processing' state
        const j = await storage.get('check-me')
        capturedStatus = j?.status
      },
    })

    // Manually push to control the id
    await storage.push({
      id: 'check-me',
      name: 'lifecycle-job',
      data: {},
      status: 'pending',
      attempts: 0,
      maxAttempts: 3,
      priority: 0,
      queue: 'default',
      createdAt: Date.now(),
    })
    queue.register(lifecycleJob)

    // Before processing
    let job = await storage.get('check-me')
    expect(job!.status).toBe('pending')

    await worker.processNext()

    // During execution it was processing
    expect(capturedStatus).toBe('processing')

    // After processing
    job = await storage.get('check-me')
    expect(job!.status).toBe('completed')
  })

  test('job lifecycle: pending -> processing -> failed -> retrying', async () => {
    const { queue, worker, storage } = setup()
    let callCount = 0

    const flakyJob = defineJob({
      name: 'flaky',
      handle: async () => {
        callCount++
        if (callCount <= 1)
          throw new Error('first fail')
      },
      retries: 3,
      backoff: 0,
    })

    const id = await queue.dispatch(flakyJob, {})

    // First attempt fails -> retrying
    await worker.processNext()
    let job = await queue.getJob(id)
    expect(job!.status).toBe('retrying')
    expect(job!.attempts).toBe(1)

    // Second attempt succeeds -> completed
    // Need to set nextRetryAt to past so pop picks it up
    await storage.update(id, { nextRetryAt: Date.now() - 1 })
    await worker.processNext()
    job = await queue.getJob(id)
    expect(job!.status).toBe('completed')
    expect(job!.attempts).toBe(2)
  })
})
