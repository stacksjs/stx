import { afterEach, describe, expect, test } from 'bun:test'
import { Scheduler } from '../src/scheduler'
import { createQueue } from '../src/queue'
import { defineJob } from '../src/job'
import { MemoryStorage } from '../src/storage/memory'

function setup() {
  const storage = new MemoryStorage()
  const queue = createQueue({ storage })
  const scheduler = new Scheduler(queue)
  return { storage, queue, scheduler }
}

const testJob = defineJob({
  name: 'scheduled-job',
  handle: async () => {},
})

describe('Scheduler', () => {
  let scheduler: Scheduler | null = null

  afterEach(() => {
    if (scheduler) {
      scheduler.stop()
      scheduler = null
    }
  })

  test('schedule returns a schedule id', () => {
    const s = setup()
    scheduler = s.scheduler
    const id = scheduler.schedule(testJob, {}, { every: 5000 })
    expect(typeof id).toBe('string')
    expect(id.length).toBeGreaterThan(0)
  })

  test('getScheduled returns all scheduled jobs', () => {
    const s = setup()
    scheduler = s.scheduler
    scheduler.schedule(testJob, {}, { every: 5000 })
    scheduler.schedule(testJob, { x: 1 }, { every: 10000 })

    const scheduled = scheduler.getScheduled()
    expect(scheduled.length).toBe(2)
    expect(scheduled[0].job).toBe('scheduled-job')
    expect(scheduled[0].config.every).toBe(5000)
  })

  test('unschedule removes a scheduled job', () => {
    const s = setup()
    scheduler = s.scheduler
    const id = scheduler.schedule(testJob, {}, { every: 5000 })
    expect(scheduler.getScheduled().length).toBe(1)

    scheduler.unschedule(id)
    expect(scheduler.getScheduled().length).toBe(0)
  })

  test('start and stop control timers', () => {
    const s = setup()
    scheduler = s.scheduler
    scheduler.schedule(testJob, {}, { every: 5000 })

    // Should not throw
    scheduler.start()
    scheduler.stop()
  })

  test('start dispatches jobs on interval', async () => {
    const s = setup()
    scheduler = s.scheduler

    scheduler.schedule(testJob, { val: 42 }, { every: 50 })
    scheduler.start()

    // Wait for at least one interval
    await new Promise(resolve => setTimeout(resolve, 120))
    scheduler.stop()

    const count = await s.queue.count()
    expect(count).toBeGreaterThanOrEqual(1)
  })

  test('schedule with cron stores config', () => {
    const s = setup()
    scheduler = s.scheduler
    const id = scheduler.schedule(testJob, {}, { cron: '*/5 * * * *' })

    const scheduled = scheduler.getScheduled()
    expect(scheduled.length).toBe(1)
    expect(scheduled[0].config.cron).toBe('*/5 * * * *')
  })

  test('schedule with invalid cron throws', () => {
    const s = setup()
    scheduler = s.scheduler

    expect(() => {
      scheduler!.schedule(testJob, {}, { cron: 'bad' })
    }).toThrow('Invalid cron expression')
  })

  test('schedule without every or cron throws', () => {
    const s = setup()
    scheduler = s.scheduler

    expect(() => {
      scheduler!.schedule(testJob, {}, {})
    }).toThrow('must have either')
  })

  test('unschedule clears running timer', async () => {
    const s = setup()
    scheduler = s.scheduler

    const id = scheduler.schedule(testJob, {}, { every: 50 })
    scheduler.start()

    // Let one tick happen
    await new Promise(resolve => setTimeout(resolve, 80))

    scheduler.unschedule(id)

    const countBefore = await s.queue.count()

    // Wait another interval
    await new Promise(resolve => setTimeout(resolve, 100))

    const countAfter = await s.queue.count()

    // No new jobs should be dispatched after unschedule
    expect(countAfter).toBe(countBefore)

    scheduler.stop()
  })
})
